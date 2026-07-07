# iOS Packaging & Monetization — Research Report (July 2026)

Context: Praxis is Next.js 16 + React 19 + Tailwind v4 + Zustand (all-local state, no accounts), AI via Anthropic API routes, deployed on Vercel.

## 1. iOS packaging options

| Option | Effort | Code reuse | App Review risk | Native capability |
|---|---|---|---|---|
| **Capacitor wrap** ✅ | Days–weeks | ~95% | Moderate (4.2), mitigable | Good via plugins |
| React Native / Expo rewrite | 2–4 months | Logic only | Low | Excellent |
| Swift/SwiftUI rewrite | 4–6+ months | ~0% | Lowest | Best |
| PWA only | ~0 | 100% | N/A | Poor on iOS — not a monetization path |

**Capacitor pattern** ([Capgo guide](https://capgo.app/blog/building-a-native-mobile-app-with-nextjs-and-capacitor/), [NextNative](https://nextnative.dev/tutorials/build-ios-app-nextjs)):
- Build with `output: 'export'` (static export) + `images: { unoptimized: true }`; `webDir: 'out'`.
- **Static export kills API routes in the bundle** → keep server on Vercel; the app calls `https://…/api/*` over HTTPS. Needs `NEXT_PUBLIC_API_BASE_URL`, CORS (or Capacitor HTTP plugin), bearer-token auth not cookies ([migration notes](https://www.muhammedrashid.in/blog/nextjs-capacitor-mobile)).
- Anti-pattern: pointing the WebView at the live URL (`server.url`) — highest 4.2 rejection risk. Bundle the assets.

**Guideline 4.2 (minimum functionality) mitigation** ([MobiLoud](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper)): push notifications (most-cited fix), haptics on game events, offline drills with designed offline states, splash/status-bar/safe-area/native share, streak widget or Live Activity (small Swift extension), review notes describing it as an interactive AI training game + demo account.

## 2. App Store monetization rules (post-Epic timeline)

- **Apr 30, 2025:** US storefront injunction — external purchase links allowed, no commission ([RevenueCat guidance](https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy/)).
- **Dec 11, 2025:** Ninth Circuit: Apple may charge a "reasonable" commission; rate remanded ([MacRumors](https://www.macrumors.com/2025/12/11/apple-app-store-fees-external-payment-links/)).
- **Apr–May 2026:** Apple seeks SCOTUS review; continues charging **0% on linked-out US purchases while pending** ([TechCrunch](https://techcrunch.com/2026/04/06/apple-epic-games-lawsuit-supreme-court-appeal-app-store-commission/)). A future single-digit-to-low-teens fee is likely ([Neon analysis](https://www.neonpay.com/blog/apple-app-store-alternative-payment-fees-what-developers-pay-in-2026)). **Don't build margin on 0% link-out.**
- **Small Business Program:** 15% commission under $1M/yr; subscriptions drop to 15% after year 1 regardless.
- **RevenueCat over raw StoreKit 2** for a solo dev: free under $2.5k MRR, receipt validation, entitlements, webhooks, cross-platform Web Billing ([comparison](https://theswiftk.it.com/blog/storekit-2-vs-revenuecat-ios-subscriptions)).
- Guideline 3.1.3(b): users who subscribed on your website can always log in on iOS.

**Recommendation:** IAP via RevenueCat primary + US web-checkout link-out (Stripe) secondary, web subs on the existing site feeding the same entitlements.

## 3. Education-app subscription benchmarks

| App | Monthly | Annual |
|---|---|---|
| Duolingo Super | $12.99 | $59.99 (Max $29.99/mo / ~$168/yr) |
| Brilliant | $27.99 | $161.88 |
| Headway | $12.99 | $89.99 |
| Speak (AI tutor — closest analog) | ~$20 | ~$99–130 |

RevenueCat State of Subscription Apps 2025/2026 ([SoSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/), [2026 benchmarks](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/)):
- Education median install→paid ≈ 6.5% by day 35; **trial→paid ~42.5% median for 17–32-day trials vs 25.5% for <4-day**; 7–14-day trials recommended for edu.
- **55% of trial cancellations happen day 0** — onboarding→first-value decides everything.
- **Hard paywall converts 10.7% vs 2.1% soft** (day-35), 8× revenue/install, identical 1-yr retention. Modern default: onboarding quiz → personalization → hard paywall with trial.
- ~72% of annual subscribers don't renew year 2; AI apps monetize 41% better per user but monthly plans churn 36% faster.
- Day-5 trial-reminder push is table stakes.

## 4. Backend: accounts, sync, entitlements (Supabase)

1. **Auth:** Supabase Auth (Sign in with Apple mandatory alongside any third-party login) + anonymous sign-in → upgrade, migrating local Zustand state on first login.
2. **Sync:** Zustand stays the runtime/offline cache; snapshots/deltas to Postgres with RLS by `user_id`; server is source of truth after login.
3. **AI cost protection:** AI routes verify Supabase JWT → check entitlement → check usage allowance → call Anthropic → log usage. Key never ships client-side (Capacitor bundles are inspectable). Per-user rate limiting via a `usage_events` table.
4. **RevenueCat → entitlements:** `Purchases.logIn(supabaseUid)` (else webhooks arrive as `$RCAnonymousID`); Supabase Edge Function receives webhooks (`INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`), verifies shared auth header, upserts `entitlements` (`user_id`, `entitlement_id`, `expires_at`, `store`) ([webhook docs](https://www.revenuecat.com/docs/integrations/webhooks), [pattern](https://medium.com/@d13nunes/implementing-revenuecat-virtual-currency-with-supabase-7944bd3444a4)). Stripe web checkout feeds the same table.

## 5. AI cost economics (mid-2026 pricing)

Haiku 4.5 $1/$5 per MTok · Sonnet ~$3/$15 (Sonnet 5 intro $2/$10 thru Aug 2026) · Opus 4.8 $5/$25. Cache reads ≈0.1× input; Batch API 50% off.

| Workload | Haiku | Sonnet | Opus |
|---|---|---|---|
| Essay grade (4k in / 1.2k out) | ~$0.01 | ~$0.03 | ~$0.05 |
| Roleplay session (10–15 turns, cached) | ~$0.03–0.07 | ~$0.10–0.20 | ~$0.25–0.45 |
| Quick drill feedback | ~$0.002 | ~$0.006 | ~$0.01 |

A heavy subscriber all-Sonnet ≈ $2–3/mo (20–30% of a $9.99 ARPU — structurally bad; [RevenueCat flags AI cost >~17% of ARPU](https://www.revenuecat.com/blog/growth/ai-feature-cost-subscription-app-margins/)). Playbook: **model tiering** (Haiku drills, Sonnet grading/roleplay, Opus premium-only → heavy user ~$0.50–1.00/mo), monthly credit allowances with hidden per-day burst caps, turn caps, prompt caching, no-API-call canned feedback for deterministic items, track cost-per-AI-active-user from day one. Free tier: ~3 Haiku grades total (~$0.03/signup).

## Recommended stack

- **Capacitor 8** + Next.js static export; server on Vercel; native layer: push, haptics, offline drills, streak widget.
- **Supabase** auth/sync/entitlements/usage; **RevenueCat** IAP + Web Billing; **Small Business Program** 15%.
- **Hard paywall after onboarding quiz**, 7-day trial on annual (default-selected), day-5 reminder push.
- **Pricing anchor:** ~$14.99/mo, $79.99–99/yr; Pro tier ~$29.99/mo with larger AI allowance + Opus deep reviews.
- **Target AI COGS ≤ ~$0.60/subscriber-month** with alerting at 15% of ARPU.

Unit sanity check: $79.99 annual → ~$68 after 15% → minus ~$7–8/yr AI → healthy margin; education's trial-conversion benchmarks make the day-0 onboarding-to-first-graded-exercise path the single highest-leverage investment.
