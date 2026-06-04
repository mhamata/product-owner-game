import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { Method } from '@/methods';
import { CATEGORY_META } from '@/methods';
import { DrillLauncher } from './drills/DrillLauncher';
import { getScenario } from '@/scenarios';

export function MethodDetail({
  method,
  categoryMeta,
  related,
}: {
  method: Method;
  categoryMeta: (typeof CATEGORY_META)[keyof typeof CATEGORY_META];
  related: Method[];
}) {
  // Resolve related scenario ids to live scenarios so we can show friendly
  // names (not raw ids) and silently drop any that were removed from the build.
  const exercisedScenarios = (method.relatedScenarios ?? [])
    .map(getScenario)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <article className="space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={cn(
              'text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded border',
              categoryMeta.color,
            )}
          >
            {categoryMeta.label}
          </span>
          {method.isCommon && (
            <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
              Common in interviews
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold">{method.name}</h1>
        <p className="text-lg text-gray-700 mt-2">{method.tldr}</p>
      </header>

      {method.formula && (
        <section className="p-4 bg-gray-50 border-l-4 border-blue-500 rounded">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Formula / Template
          </div>
          <pre className="text-sm font-mono whitespace-pre-wrap">{method.formula}</pre>
        </section>
      )}

      <section className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
          <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide mb-2">
            ✓ When to use
          </h3>
          <p className="text-sm text-emerald-950">{method.whenToUse}</p>
        </div>
        {method.whenNotToUse && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded">
            <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wide mb-2">
              ✗ When NOT to use
            </h3>
            <p className="text-sm text-rose-950">{method.whenNotToUse}</p>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
            Benefits
          </h3>
          <ul className="space-y-1.5 text-sm list-disc pl-5">
            {method.benefits.map((b, i) => (
              <li key={i} className="text-gray-800">
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
            Limitations
          </h3>
          <ul className="space-y-1.5 text-sm list-disc pl-5">
            {method.limitations.map((b, i) => (
              <li key={i} className="text-gray-800">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {method.pitfalls && method.pitfalls.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-amber-700 mb-2">
            ⚠ Common pitfalls
          </h3>
          <ul className="space-y-1.5 text-sm list-disc pl-5">
            {method.pitfalls.map((p, i) => (
              <li key={i} className="text-gray-800">
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {method.example && (
        <section className="p-4 bg-indigo-50 border border-indigo-200 rounded">
          <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1">
            Worked example
          </div>
          <h4 className="font-semibold text-indigo-950 mb-2">{method.example.title}</h4>
          <pre className="text-sm text-indigo-950 whitespace-pre-wrap font-sans">
            {method.example.body}
          </pre>
        </section>
      )}

      {method.drill && <DrillLauncher drillType={method.drill} />}

      {exercisedScenarios.length > 0 && (
        <section className="pt-4 border-t">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
            Exercised in scenarios
          </h3>
          <div className="flex gap-2 flex-wrap">
            {exercisedScenarios.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/play/${scenario.id}`}
                className="text-sm px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded hover:bg-blue-100"
              >
                {scenario.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="pt-4 border-t">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
            Related methods
          </h3>
          <div className="grid md:grid-cols-3 gap-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/methods/${r.id}`}
                className="text-sm p-2 border border-gray-200 rounded hover:border-blue-400"
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-600 line-clamp-1">{r.tldr}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
