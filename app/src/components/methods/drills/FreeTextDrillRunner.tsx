'use client';

import { useState } from 'react';
import type { FreeTextDrill, FreeTextValues } from '@/curriculum/drills';
import { GradeDisplay, useLLMGrade } from './LLMGrade';

/**
 * Shared library renderer for the free-text, LLM-graded drills (JTBD, Mom Test,
 * Pre-Mortem, PR-FAQ). It is a THIN renderer of an already-resolved
 * industry-aware `FreeTextDrill`: the brief, prompt, per-field labels +
 * placeholders, live preview, the string sent to the grader, and the persona/
 * context all come from the shared config (`src/curriculum/drills`). Nothing
 * here is industry-specific; the caller resolves the drill for the home
 * industry and hands it down, so /methods and /learn render the same content.
 *
 * Grading is unchanged: it POSTs to /api/grade via `useLLMGrade(drill.drillId)`
 * with `drill.composeInput(values)` and `drill.buildContext?.(values)`, exactly
 * the path the inline /methods components used before.
 */
export function FreeTextDrillRunner({ drill }: { drill: FreeTextDrill }) {
  const [values, setValues] = useState<FreeTextValues>({});
  const { grade, result, loading, reset } = useLLMGrade(drill.drillId);

  const ready = drill.isReady(values);
  const previewText = drill.preview?.(values);

  const setField = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleGrade = () =>
    grade(drill.composeInput(values), drill.buildContext?.(values));

  const handleReset = () => {
    setValues({});
    reset();
  };

  return (
    <div className="space-y-4">
      {/* brief / assignment / persona, sourced from the resolved config */}
      <div className="rounded-console border border-line bg-paper p-3">
        <div className="mono mb-1 text-[10.5px] uppercase tracking-[0.12em] text-mute">
          {drill.briefTitle}
        </div>
        <p className="text-[13.5px] leading-[1.6] text-ink-2">{drill.brief}</p>
      </div>

      <p className="text-[13.5px] text-slate">{drill.prompt}</p>

      <div className="space-y-3">
        {drill.fields.map((field) => {
          const inputId = `${drill.drillId}-${field.key}`;
          const shared =
            'w-full rounded-console-sm border border-line bg-paper px-2 py-1.5 text-[13.5px] text-ink placeholder:text-faint focus:border-accent focus:outline-none';
          return (
            <div key={field.key}>
              <label
                htmlFor={inputId}
                className="mono mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-mute"
              >
                {field.label}
              </label>
              {field.multiline ?? true ? (
                <textarea
                  id={inputId}
                  rows={field.rows ?? 3}
                  value={values[field.key] ?? ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`${shared} resize-y`}
                />
              ) : (
                <input
                  id={inputId}
                  type="text"
                  value={values[field.key] ?? ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={shared}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* live composed preview (e.g. the JTBD sentence), when the drill has one */}
      {previewText && (
        <div className="rounded-console border border-dashed border-line bg-panel-2 px-3 py-2.5">
          <div className="mono mb-1 text-[10px] uppercase tracking-[0.1em] text-faint">
            Your statement
          </div>
          <p className="text-[13.5px] italic leading-[1.55] text-ink-2">
            {previewText}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGrade}
          disabled={loading || !ready}
          className="mono flex-1 rounded-console bg-accent py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-faint"
        >
          {loading ? 'Grading…' : 'Grade with Claude'}
        </button>
        {result && (
          <button
            type="button"
            onClick={handleReset}
            className="mono rounded-console border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate transition-colors hover:border-faint hover:text-ink"
          >
            Reset
          </button>
        )}
      </div>

      <GradeDisplay result={result} loading={loading} />

      {!process.env.NEXT_PUBLIC_HAS_KEY && (
        <p className="text-[12px] text-mute">
          Requires{' '}
          <code className="mono rounded bg-panel px-1 py-0.5 text-[11.5px] text-ink-2">
            ANTHROPIC_API_KEY
          </code>{' '}
          in{' '}
          <code className="mono rounded bg-panel px-1 py-0.5 text-[11.5px] text-ink-2">
            .env.local
          </code>
          .
        </p>
      )}
    </div>
  );
}
