'use client';
// 클릭 이벤트가 필요해서 클라이언트 컴포넌트
import { useState } from 'react';
import { authClient } from '@/lib/auth/client';

export default function GoogleButton({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      // 구글 로그인 화면으로 이동 → 끝나면 next 경로로 돌아옴
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin + next,
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded border px-4 py-3 font-medium hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? '이동 중...' : 'Google로 로그인'}
    </button>
  );
}
