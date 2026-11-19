// 문서 보기 페이지: /w/문서id
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { requireViewAccess, RANK } from '@/lib/permissions';
import { togglePublic } from '@/app/actions';
import Markdown from '@/components/markdown';

export default async function WikiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, role } = await requireViewAccess(id);

  const page = await db.query.pages.findFirst({ where: eq(pages.id, id) });
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      {user ? 
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← 내 위키
        </Link> 
        : <Link href="/login" className="text-sm text-gray-500 hover:underline"> 
        ← 로그인
      </Link> }

      <div className="mt-4 flex items-end justify-between border-b-2 border-[#00a495] pb-2">
        <h1 className="text-3xl font-bold">{page.title}</h1>
        <nav className="flex gap-1 text-sm">
          {role && RANK[role] >= RANK.editor && (
            <Link href={`/docs/${id}/edit`} className="rounded border px-2 py-1 hover:bg-gray-50">
              편집
            </Link>
          )}
          {<Link href={`/docs/${id}/history`} className="rounded border px-2 py-1 hover:bg-gray-50">
              역사
            </Link>
          }
          {role === 'owner' && (
            <Link href={`/docs/${id}/settings`} className="rounded border px-2 py-1 hover:bg-gray-50">
              설정
            </Link>
          )}
        </nav>
      </div>

      <p className="mt-2 text-right text-xs text-gray-500">
        최근 수정: {page.updatedAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
      </p>

      <article className="mt-4">
        {page.content ? <Markdown>{page.content}</Markdown> : <p className="text-gray-500">아직 내용이 없어.</p>}
      </article>
    </main>
  );
}
