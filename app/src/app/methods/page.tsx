import Link from 'next/link';
import { methods, CATEGORY_META, type MethodCategory } from '@/methods';
import { MethodCard } from '@/components/methods/MethodCard';

export const metadata = {
  title: 'PM Methods — PRAXIS',
  description:
    'Complete study library: 37 PM methods with when-to-use, benefits, limitations, and interactive drills.',
};

export default function MethodsPage() {
  const common = methods.filter((m) => m.isCommon);
  const byCategory = (Object.keys(CATEGORY_META) as MethodCategory[]).map((cat) => ({
    category: cat,
    meta: CATEGORY_META[cat],
    methods: methods.filter((m) => m.category === cat),
  }));

  return (
    <main className="flex-1 max-w-6xl mx-auto px-6 py-10">
      <header className="mb-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Home
        </Link>
        <h1 className="text-3xl font-bold mt-2">PM Methods Library</h1>
        <p className="text-gray-600 mt-2">
          {methods.length} methods across 6 categories. Click any method for the full breakdown
          plus interactive practice.
        </p>
      </header>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">🎯 Most commonly asked in PM interviews</h2>
            <p className="text-sm text-gray-500">
              Study these first — each has a worked example and an interactive drill.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {common.map((m) => (
            <MethodCard key={m.id} method={m} highlight />
          ))}
        </div>
      </section>

      {byCategory.map(({ category, meta, methods: catMethods }) => (
        <section key={category} className="mb-10">
          <div className="border-b pb-2 mb-4">
            <h2 className="text-xl font-semibold">{meta.label}</h2>
            <p className="text-sm text-gray-500">{meta.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {catMethods.map((m) => (
              <MethodCard key={m.id} method={m} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
