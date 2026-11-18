// 편집 기록 (나무위키 "역사")
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pages, revisions } from '@/lib/db/schema';
import { requireRole } from '@/lib/permissions';

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole(id, 'viewer');

  const page = await db.query.pages.findFirst({ where: eq(pages.id, id), columns: { title: true } });
  if (!page) notFound();

  const list = await db.query.revisions.findMany({
    where: eq(revisions.pageId, id),
    orderBy: [desc(revisions.version)],
    columns: { version: true, editedBy: true, createdAt: true, content: true },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href={`/w/${id}`} className="text-sm text-gray-500 hover:underline">
        ← {page.title}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{page.title}의 역사</h1>

      <ul className="mt-6 divide-y rounded border text-sm">
        {list.map((r) => (
          <li key={r.version} className="flex justify-between p-3">
            <span>
              <b>r{r.version}</b> · {r.editedBy}
            </span>
            <span className="text-gray-500">
              {r.content.length.toLocaleString()}자 ·{' '}
              {r.createdAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
            </span>
          </li>
        ))}
        {list.length === 0 && <li className="p-3 text-gray-500">아직 편집 기록이 없어.</li>}
      </ul>
    </main>
  );
}
