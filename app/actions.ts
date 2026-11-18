'use server';
// Server Actions: 브라우저에서 호출하지만 서버에서 실행되는 함수들.
// DB를 바꾸는 일은 전부 여기서 하고, 첫 줄에서 항상 권한을 확인해.

import { randomBytes } from 'node:crypto';
import { redirect, notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pages, revisions, members, inviteLinks, blockedEmails } from '@/lib/db/schema';
import { getCurrentUser, requireRole, isBlocked, getValidInvite, RANK } from '@/lib/permissions';

const normalizeEmail = (v: FormDataEntryValue | null) => String(v ?? '').trim().toLowerCase();

// ───────────── 문서 ─────────────

export async function createPage(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;

  const [page] = await db
    .insert(pages)
    .values({ title, createdBy: user.email })
    .returning({ id: pages.id });

  // 만든 사람은 자동으로 소유자
  await db.insert(members).values({ pageId: page.id, email: user.email, role: 'owner' });

  redirect(`/w/${page.id}/edit`);
}

export async function savePage(pageId: string, title: string, content: string, baseVersion: number) {
  const { user } = await requireRole(pageId, 'editor');

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { error: '제목을 입력해줘' };

  // "내가 편집을 시작한 버전"이 아직 최신일 때만 저장 (낙관적 잠금)
  const updated = await db
    .update(pages)
    .set({ title: trimmedTitle, content, version: sql`${pages.version} + 1`, updatedAt: new Date() })
    .where(and(eq(pages.id, pageId), eq(pages.version, baseVersion)))
    .returning({ version: pages.version });

  if (updated.length === 0) {
    return {
      error: '편집하는 사이에 다른 친구가 먼저 저장했어. 지금 쓴 내용을 복사해두고 새로고침한 다음 다시 합쳐줘!',
    };
  }

  await db.insert(revisions).values({
    pageId,
    version: updated[0].version,
    content,
    editedBy: user.email,
  });

  revalidatePath(`/w/${pageId}`);
  return { ok: true as const };
}

// ───────────── 멤버 (소유자만) ─────────────

export async function addMember(pageId: string, formData: FormData) {
  await requireRole(pageId, 'owner');

  const email = normalizeEmail(formData.get('email'));
  const role = formData.get('role') === 'editor' ? 'editor' : 'viewer';
  if (!email.includes('@')) return;
  if (await isBlocked(pageId, email)) return; // 차단된 사람은 초대 불가

  const existing = await db.query.members.findFirst({
    where: and(eq(members.pageId, pageId), eq(members.email, email)),
  });
  if (existing?.role === 'owner') return; // 소유자 권한은 못 바꿈

  if (existing) {
    await db.update(members).set({ role }).where(and(eq(members.pageId, pageId), eq(members.email, email)));
  } else {
    await db.insert(members).values({ pageId, email, role });
  }
  revalidatePath(`/w/${pageId}/settings`);
}

export async function removeMember(pageId: string, email: string) {
  await requireRole(pageId, 'owner');
  await db
    .delete(members)
    .where(and(eq(members.pageId, pageId), eq(members.email, email), ne(members.role, 'owner')));
  revalidatePath(`/w/${pageId}/settings`);
}

// ───────────── 초대 링크 (소유자만) ─────────────

export async function createInviteLink(pageId: string, formData: FormData) {
  await requireRole(pageId, 'owner');

  const role = formData.get('role') === 'editor' ? 'editor' : 'viewer';
  const days = Number(formData.get('days')) || 7;

  await db.insert(inviteLinks).values({
    token: randomBytes(24).toString('base64url'), // 추측 불가능한 랜덤 토큰
    pageId,
    role,
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });
  revalidatePath(`/w/${pageId}/settings`);
}

export async function revokeInviteLink(pageId: string, token: string) {
  await requireRole(pageId, 'owner');
  await db
    .update(inviteLinks)
    .set({ revoked: true })
    .where(and(eq(inviteLinks.token, token), eq(inviteLinks.pageId, pageId)));
  revalidatePath(`/w/${pageId}/settings`);
}

export async function acceptInvite(token: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/invite/${token}`);

  const link = await getValidInvite(token);
  if (!link) notFound();
  if (await isBlocked(link.pageId, user.email)) notFound();

  const existing = await db.query.members.findFirst({
    where: and(eq(members.pageId, link.pageId), eq(members.email, user.email)),
  });

  if (!existing) {
    await db.insert(members).values({ pageId: link.pageId, email: user.email, role: link.role });
  } else if (RANK[link.role] > RANK[existing.role]) {
    // 이미 멤버인데 링크 권한이 더 높으면 올려줌
    await db
      .update(members)
      .set({ role: link.role })
      .where(and(eq(members.pageId, link.pageId), eq(members.email, user.email)));
  }

  redirect(`/w/${link.pageId}`);
}

// ───────────── 차단 (소유자만) ─────────────

export async function blockEmail(pageId: string, formData: FormData) {
  const { user } = await requireRole(pageId, 'owner');

  const email = normalizeEmail(formData.get('email'));
  if (!email.includes('@') || email === user.email) return;

  await db.insert(blockedEmails).values({ pageId, email }).onConflictDoNothing();
  // 이미 멤버였다면 내보내기
  await db
    .delete(members)
    .where(and(eq(members.pageId, pageId), eq(members.email, email), ne(members.role, 'owner')));
  revalidatePath(`/w/${pageId}/settings`);
}

export async function unblockEmail(pageId: string, email: string) {
  await requireRole(pageId, 'owner');
  await db.delete(blockedEmails).where(and(eq(blockedEmails.pageId, pageId), eq(blockedEmails.email, email)));
  revalidatePath(`/w/${pageId}/settings`);
}
