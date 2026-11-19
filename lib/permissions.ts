// 권한 검사의 핵심 파일.
// 페이지를 보여주거나 데이터를 바꾸는 모든 곳에서 requireRole()을 먼저 호출
import { redirect, notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { pages, members, blockedEmails, inviteLinks } from '@/lib/db/schema';

export type Role = 'viewer' | 'editor' | 'owner';
/*
  로그인 안 함 → 메인 화면
  비공개문서 -> 멤버만 읽기 가능
  공개 문서 -> 모두 읽을 수 있지만 편집은 멤버만 가능
 */

// 숫자가 클수록 권한이 강함. editor 이상 = RANK >= 2
export const RANK: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };
export const ROLE_LABEL: Record<Role, string> = { viewer: '읽기', editor: '편집', owner: '소유자' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 지금 로그인한 사람. 로그인 안 했으면 null */
export async function getCurrentUser() {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user?.email) return null;
  return { id: user.id, name: user.name, email: user.email.toLowerCase() };
}

export async function isBlocked(pageId: string, email: string) {
  const row = await db.query.blockedEmails.findFirst({
    where: and(eq(blockedEmails.pageId, pageId), eq(blockedEmails.email, email)),
  });
  return !!row;
}

/** 이 사람이 이 문서에서 가진 권한. 멤버가 아니거나 차단됐으면 null */
export async function getRole(pageId: string, email: string): Promise<Role | null> {
  if (await isBlocked(pageId, email)) return null;
  const member = await db.query.members.findFirst({
    where: and(eq(members.pageId, pageId), eq(members.email, email)),
  });
  return member?.role ?? null;
}


export async function requireRole(pageId: string, minRole: Role) {
  if (!UUID_RE.test(pageId)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/w/${pageId}`);

  const role = await getRole(pageId, user.email);
  if (!role || RANK[role] < RANK[minRole]) notFound();

  return { user, role };
}

/*
  로그인했고 멤버면 통과 (role 반환)
  멤버는 아닌데 공개 문서면 통과
  비공개인데 로그인을 안했으면 -> 로그인 페이지로
  비공개인데 멤버가 아니면 -> 404
*/
export async function requireViewAccess(pageId: string) {
  if (!UUID_RE.test(pageId)) notFound();
  const user = await getCurrentUser();
  const role = user ? await getRole(pageId, user.email) : null;
  if (role) return {user, role};

  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
    columns: {isPublic: true},
  });
  if (page?.isPublic) return {user, role: null};
  if(!user) redirect(`/login?next=/docs/${pageId}`);
  notFound();

}

/** 유효한 초대 링크면 돌려주고, 폐기/만료됐으면 null */
export async function getValidInvite(token: string) {
  const link = await db.query.inviteLinks.findFirst({ where: eq(inviteLinks.token, token) });
  if (!link || link.revoked) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;
  return link;
}
