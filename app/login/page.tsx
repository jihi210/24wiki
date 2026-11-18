// 로그인 페이지 (서버 컴포넌트)
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/permissions';
import GoogleButton from './google-button';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // 외부 사이트로 튕기는 공격 방지: 우리 사이트 안쪽 경로(/로 시작)만 허용
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const user = await getCurrentUser();
  if (user) redirect(safeNext);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">🎂 생일 위키</h1>
      <p className="text-center text-sm text-gray-600">초대받은 구글 계정으로 로그인해줘</p>
      <GoogleButton next={safeNext} />
    </main>
  );
}
