-- PHASE 0 SUBSTRATE: accounts, sync, learner model, entitlements, AI budgets.
--
-- Design source: docs/research/design-ai-native.md (memory model + budget gate)
-- and docs/MASTER_PLAN.md §5. Server-side truth for anything that touches
-- money or rating; the client's Zustand stores remain the runtime/offline
-- cache and sync snapshots here after sign-in.
--
-- RLS policy stance:
--   * learners can READ everything that is theirs;
--   * learners can WRITE only low-stakes surfaces (state snapshots, their own
--     practice event log, deleting their own mentor-memory facts);
--   * money- and rating-adjacent tables (entitlements, budgets, competency
--     state, usage log) are written ONLY by the server (service role bypasses
--     RLS; no client-facing write policies exist).

-- ==================================================================
-- learner_state: per-store JSON snapshots (Zustand sync).
-- ==================================================================
create table public.learner_state (
  user_id    uuid not null references auth.users (id) on delete cascade,
  store_key  text not null check (char_length(store_key) <= 64),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, store_key)
);

alter table public.learner_state enable row level security;

create policy "read own state"
  on public.learner_state for select
  using ((select auth.uid()) = user_id);

create policy "insert own state"
  on public.learner_state for insert
  with check ((select auth.uid()) = user_id);

create policy "update own state"
  on public.learner_state for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ==================================================================
-- exercise_events: append-only ground truth of everything practiced.
-- ==================================================================
create table public.exercise_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  ts         timestamptz not null default now(),
  kind       text not null check (kind in
               ('drill','judgment_card','artifact','roleplay','sim_decision','placement','interview')),
  competency text,
  skill_id   text,
  score      numeric check (score is null or (score >= 0 and score <= 1)),
  payload    jsonb not null default '{}'::jsonb
);

create index exercise_events_user_ts on public.exercise_events (user_id, ts desc);

alter table public.exercise_events enable row level security;

create policy "read own events"
  on public.exercise_events for select
  using ((select auth.uid()) = user_id);

-- Clients may append their own practice events (low stakes: practice history).
-- Rating-bearing events are re-derived server-side; nothing here is trusted
-- for money or rating without server verification.
create policy "append own events"
  on public.exercise_events for insert
  with check ((select auth.uid()) = user_id);

-- ==================================================================
-- competency_state: rolled-up per-competency learner model (server-written).
-- ==================================================================
create table public.competency_state (
  user_id          uuid not null references auth.users (id) on delete cascade,
  competency       text not null,
  rating           numeric not null default 1200,
  rating_sigma     numeric not null default 350,
  attempts_7d      integer not null default 0,
  trend_30d        numeric,
  last_practiced   timestamptz,
  weak_rubric_dims jsonb,
  updated_at       timestamptz not null default now(),
  primary key (user_id, competency)
);

alter table public.competency_state enable row level security;

create policy "read own competency state"
  on public.competency_state for select
  using ((select auth.uid()) = user_id);

-- ==================================================================
-- mentor_memory: the coach's distilled notes file (max ~40 active facts;
-- cap enforced by the server-side writer, not the schema).
-- ==================================================================
create table public.mentor_memory (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('goal','context','pattern','preference','commitment')),
  content    text not null check (char_length(content) <= 280),
  source     text not null,
  weight     numeric not null default 1.0,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index mentor_memory_user on public.mentor_memory (user_id);

alter table public.mentor_memory enable row level security;

create policy "read own memory"
  on public.mentor_memory for select
  using ((select auth.uid()) = user_id);

-- Users can delete facts about themselves (a trust feature and a GDPR one).
create policy "delete own memory"
  on public.mentor_memory for delete
  using ((select auth.uid()) = user_id);

-- ==================================================================
-- entitlements: what the user has paid for. Written only by the server
-- (RevenueCat webhook -> edge function; Stripe webhook -> same table).
-- ==================================================================
create table public.entitlements (
  user_id        uuid not null references auth.users (id) on delete cascade,
  entitlement_id text not null,
  store          text not null check (store in ('app_store','stripe','promo')),
  expires_at     timestamptz,
  updated_at     timestamptz not null default now(),
  primary key (user_id, entitlement_id)
);

alter table public.entitlements enable row level security;

create policy "read own entitlements"
  on public.entitlements for select
  using ((select auth.uid()) = user_id);

-- ==================================================================
-- user_budgets: monthly AI allowance in cost-normalized cents.
-- ==================================================================
create table public.user_budgets (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  tier         text not null default 'free',
  period_start date not null default (date_trunc('month', now()))::date,
  cents_used   integer not null default 0 check (cents_used >= 0),
  cents_cap    integer not null default 15 check (cents_cap >= 0),
  hard_blocked boolean not null default false,
  updated_at   timestamptz not null default now()
);

alter table public.user_budgets enable row level security;

create policy "read own budget"
  on public.user_budgets for select
  using ((select auth.uid()) = user_id);

-- ==================================================================
-- usage_events: audit log of every AI call (server-written).
-- ==================================================================
create table public.usage_events (
  id              bigint generated always as identity primary key,
  user_id         uuid references auth.users (id) on delete set null,
  ts              timestamptz not null default now(),
  route           text not null,
  model           text not null,
  input_tokens    integer not null default 0,
  output_tokens   integer not null default 0,
  estimated_cents numeric not null default 0
);

create index usage_events_user_ts on public.usage_events (user_id, ts desc);
create index usage_events_ts on public.usage_events (ts desc);

alter table public.usage_events enable row level security;

create policy "read own usage"
  on public.usage_events for select
  using ((select auth.uid()) = user_id);

-- ==================================================================
-- Budget gate: atomic reserve-then-settle. Reserve pessimistically before the
-- model call; settle the difference after, from the real usage numbers. The
-- period rolls forward lazily on first reserve of a new month.
--
-- SECURITY DEFINER + revoked from client roles: only the server (service
-- role) may move budget numbers; a client cannot grant itself allowance.
-- ==================================================================
create or replace function public.reserve_budget(p_user uuid, p_estimate_cents integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_estimate_cents < 0 then
    return false;
  end if;

  -- First touch: create the row at the free-tier default.
  insert into user_budgets (user_id) values (p_user)
  on conflict (user_id) do nothing;

  -- Lazy monthly rollover.
  update user_budgets
     set cents_used = 0,
         period_start = (date_trunc('month', now()))::date,
         updated_at = now()
   where user_id = p_user
     and period_start < (date_trunc('month', now()))::date;

  -- The atomic check-and-reserve: succeeds only within cap and not blocked.
  update user_budgets
     set cents_used = cents_used + p_estimate_cents,
         updated_at = now()
   where user_id = p_user
     and cents_used + p_estimate_cents <= cents_cap
     and not hard_blocked;

  return found;
end
$$;

create or replace function public.settle_budget(p_user uuid, p_reserved_cents integer, p_actual_cents integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update user_budgets
     set cents_used = greatest(0, cents_used - p_reserved_cents + p_actual_cents),
         updated_at = now()
   where user_id = p_user;
end
$$;

revoke execute on function public.reserve_budget(uuid, integer) from public, anon, authenticated;
revoke execute on function public.settle_budget(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_budget(uuid, integer) to service_role;
grant execute on function public.settle_budget(uuid, integer, integer) to service_role;
