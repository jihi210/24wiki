// ⭐ 권한 검사의 핵심 파일.
// 페이지를 보여주거나 데이터를 바꾸는 모든 곳에서 requireRole()을 먼저 호출해.
import { redirect, notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { members, blockedEmails, inviteLinks } from '@/lib/db/schema';

export type Role = 'viewer' | 'editor' | 'owner';

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

/**
 * 최소 권한(minRole)이 없으면 여기서 멈춤.
 * - 로그인 안 함 → 로그인 페이지로
 * - 권한 없음/차단됨 → 404 (문서가 있는지조차 모르게!)
 */
export async function requireRole(pageId: string, minRole: Role) {
  if (!UUID_RE.test(pageId)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/w/${pageId}`);

  const role = await getRole(pageId, user.email);
  if (!role || RANK[role] < RANK[minRole]) notFound();

  return { user, role };
}

/** 유효한 초대 링크면 돌려주고, 폐기/만료됐으면 null */
export async function getValidInvite(token: string) {
  const link = await db.query.inviteLinks.findFirst({ where: eq(inviteLinks.token, token) });
  if (!link || link.revoked) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;
  return link;
}
