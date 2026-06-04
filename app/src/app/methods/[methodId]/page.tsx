import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMethod, methods, CATEGORY_META } from '@/methods';
import { MethodDetail } from '@/components/methods/MethodDetail';

export async function generateStaticParams() {
  return methods.map((m) => ({ methodId: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ methodId: string }>;
}) {
  const { methodId } = await params;
  const method = getMethod(methodId);
  return {
    title: method ? `${method.name} | PRAXIS` : 'Method not found',
    description: method?.tldr,
  };
}

export default async function MethodDetailPage({
  params,
}: {
  params: Promise<{ methodId: string }>;
}) {
  const { methodId } = await params;
  const method = getMethod(methodId);
  if (!method) notFound();

  const meta = CATEGORY_META[method.category];
  const related = methods
    .filter((m) => m.id !== method.id && m.category === method.category)
    .slice(0, 3);

  return (
    <main className="flex-1 max-w-4xl mx-auto px-6 py-8">
      <nav className="text-sm mb-4">
        <Link href="/methods" className="text-blue-600 hover:underline">
          ← All methods
        </Link>
      </nav>

      <MethodDetail method={method} categoryMeta={meta} related={related} />
    </main>
  );
}
