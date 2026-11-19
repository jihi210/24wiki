// 문서 설정 (소유자 전용): 멤버 관리, 초대 링크, 차단
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pages, members, inviteLinks, blockedEmails } from '@/lib/db/schema';
import { requireRole, ROLE_LABEL } from '@/lib/permissions';
import {
  addMember,
  removeMember,
  createInviteLink,
  revokeInviteLink,
  blockEmail,
  unblockEmail,
  togglePublic,
} from '@/app/actions';
import CopyLinkButton from '@/components/copy-link-button';

const input = 'rounded border px-3 py-2 text-sm';
const btn = 'rounded bg-black px-3 py-2 text-sm text-white';
const smallBtn = 'text-xs text-red-600 hover:underline';

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole(id, 'owner');

  const page = await db.query.pages.findFirst({ where: eq(pages.id, id) });
  if (!page) notFound();

  // 세 개 쿼리를 동시에 실행
  const [memberList, links, blocked] = await Promise.all([
    db.query.members.findMany({ where: eq(members.pageId, id) }),
    db.query.inviteLinks.findMany({
      where: and(eq(inviteLinks.pageId, id), eq(inviteLinks.revoked, false)),
      orderBy: [desc(inviteLinks.createdAt)],
    }),
    db.query.blockedEmails.findMany({ where: eq(blockedEmails.pageId, id) }),
  ]);
  const now = new Date();

  return (
    <main className="mx-auto max-w-2xl space-y-10 p-6">
      <div>
        <Link href={`/docs/${id}`} className="text-sm text-gray-500 hover:underline">
          ← {page.title}
        </Link>
        <h1 className="mt-4 text-2xl font-bold">설정</h1>
      </div>

      <section>
        <h2 className="mb-1 text-lg font-bold">공개 설정</h2>
        <p className="mb-3 text-sm">
          현재: <b>{page.isPublic ? '🌐 공개' : '🔒 비공개'}</b>
        </p>
        <form action={togglePublic.bind(null, id)}>
          <button className={btn}>{page.isPublic ? '비공개로 바꾸기' : '공개로 바꾸기'}</button>
        </form>
      </section>

      {/* ── 멤버 ── */}
      <section>
        <h2 className="mb-3 text-lg font-bold">멤버</h2>
        <ul className="mb-3 divide-y rounded border text-sm">
          {memberList.map((m) => (
            <li key={m.email} className="flex items-center justify-between p-3">
              <span>
                {m.email} <span className="text-gray-500">· {ROLE_LABEL[m.role]}</span>
              </span>
              {m.role !== 'owner' && (
                // .bind로 "어떤 문서의 누구"인지 미리 넣어둔 Server Action
                <form action={removeMember.bind(null, id, m.email)}>
                  <button className={smallBtn}>내보내기</button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <form action={addMember.bind(null, id)} className="flex gap-2">
          <input name="email" type="email" required placeholder="친구 구글 이메일" className={`${input} flex-1`} />
          <select name="role" defaultValue="editor" className={input}>
            <option value="editor">편집</option>
            <option value="viewer">읽기</option>
          </select>
          <button className={btn}>추가</button>
        </form>
      </section>

      {/* ── 초대 링크 ── */}
      <section>
        <h2 className="mb-1 text-lg font-bold">초대 링크</h2>
        <p className="mb-3 text-xs text-gray-500">
          링크를 받은 사람은 구글 로그인만 하면 바로 멤버가 돼. 생일 당사자가 있는 단톡방엔 보내지 마!
        </p>
        <ul className="mb-3 divide-y rounded border text-sm">
          {links.map((l) => {
            const expired = !!l.expiresAt && l.expiresAt < now;
            return (
              <li key={l.token} className="flex items-center justify-between gap-2 p-3">
                <span>
                  {ROLE_LABEL[l.role]} 링크 ·{' '}
                  <span className="text-gray-500">
                    {expired ? '만료됨' : `${l.expiresAt?.toLocaleDateString('ko-KR')}까지`}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  {!expired && <CopyLinkButton path={`/invite/${l.token}`} />}
                  <form action={revokeInviteLink.bind(null, id, l.token)}>
                    <button className={smallBtn}>폐기</button>
                  </form>
                </span>
              </li>
            );
          })}
          {links.length === 0 && <li className="p-3 text-gray-500">활성 링크 없음</li>}
        </ul>
        <form action={createInviteLink.bind(null, id)} className="flex gap-2">
          <select name="role" defaultValue="editor" className={input}>
            <option value="editor">편집 권한</option>
            <option value="viewer">읽기 권한</option>
          </select>
          <select name="days" defaultValue="7" className={input}>
            <option value="1">1일 유효</option>
            <option value="7">7일 유효</option>
            <option value="30">30일 유효</option>
          </select>
          <button className={btn}>링크 만들기</button>
        </form>
      </section>

      {/* ── 차단 ── */}
      <section>
        <h2 className="mb-1 text-lg font-bold">차단</h2>
        <p className="mb-3 text-xs text-gray-500">
          여기 등록된 이메일로 로그인하면 이 문서가 아예 없는 것처럼(404) 보여. 친구가 쓰는 이메일을 다 넣어둬.
        </p>
        <ul className="mb-3 divide-y rounded border text-sm">
          {blocked.map((b) => (
            <li key={b.email} className="flex items-center justify-between p-3">
              <span>{b.email}</span>
              <form action={unblockEmail.bind(null, id, b.email)}>
                <button className={smallBtn}>해제</button>
              </form>
            </li>
          ))}
          {blocked.length === 0 && <li className="p-3 text-gray-500">차단된 이메일 없음</li>}
        </ul>
        <form action={blockEmail.bind(null, id)} className="flex gap-2">
          <input name="email" type="email" required placeholder="생일 당사자 이메일" className={`${input} flex-1`} />
          <button className={btn}>차단</button>
        </form>
      </section>
    </main>
  );
}
