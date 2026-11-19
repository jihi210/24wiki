// 홈: 내가 멤버인 문서 목록 + 새 문서 만들기
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { members, pages } from '@/lib/db/schema';
import { getCurrentUser, ROLE_LABEL } from '@/lib/permissions';
import SignOutButton from '@/components/sign-out-button';
import CreatePageForm from '@/components/create-page-form';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // members와 pages를 조인해서 "내가 속한 문서"만 가져오기
  const myPages = await db
    .select({ id: pages.id, title: pages.title, role: members.role, updatedAt: pages.updatedAt })
    .from(members)
    .innerJoin(pages, eq(members.pageId, pages.id))
    .where(eq(members.email, user.email))
    .orderBy(desc(pages.updatedAt));

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">24 Wiki</h1>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* Server Action을 form action에 바로 연결. JS 없이도 동작해! */}
      <CreatePageForm />

      {myPages.length === 0 ? (
        <p className="text-gray-500">아직 문서가 없습니다.</p>
      ) : (
        <ul className="divide-y rounded border">
          {myPages.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-3">
              <Link href={`/docs/${p.id}`} className="font-medium hover:underline">
                {p.title}
              </Link>
              <span className="text-xs text-gray-500">{ROLE_LABEL[p.role]}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
