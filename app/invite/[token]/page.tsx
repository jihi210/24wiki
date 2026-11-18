// 초대 링크로 들어왔을 때: /invite/토큰
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { getCurrentUser, getValidInvite, isBlocked, ROLE_LABEL } from '@/lib/permissions';
import { acceptInvite } from '@/app/actions';

function InvalidLink() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center justify-center p-6">
      <p className="text-gray-600">만료되었거나 존재하지 않는 링크야.</p>
    </main>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/invite/${token}`);

  const link = await getValidInvite(token);
  // 차단된 사람한테도 "없는 링크"라고만 보여줌 → 뭔가 있다는 눈치를 못 챔
  if (!link || (await isBlocked(link.pageId, user.email))) return <InvalidLink />;

  const page = await db.query.pages.findFirst({ where: eq(pages.id, link.pageId), columns: { title: true } });
  if (!page) return <InvalidLink />;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold">「{page.title}」 위키에 초대받았어!</h1>
      <p className="text-sm text-gray-600">
        {ROLE_LABEL[link.role]} 권한으로 참여하게 돼 ({user.email})
      </p>
      {/* 링크를 열기만 해서는 가입 안 되고, 버튼을 눌러야 멤버가 됨 */}
      <form action={acceptInvite.bind(null, token)}>
        <button className="rounded bg-black px-5 py-2 text-white">참여하기</button>
      </form>
    </main>
  );
}
