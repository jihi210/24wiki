'use client';
import { authClient } from '@/lib/auth/client';

export default function SignOutButton() {
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        window.location.href = '/login';
      }}
      className="underline"
    >
      로그아웃
    </button>
  );
}
