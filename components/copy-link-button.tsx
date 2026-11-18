'use client';
// 클립보드 복사는 브라우저 기능이라 클라이언트 컴포넌트
import { useState } from 'react';

export default function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.origin + path);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs text-blue-600 hover:underline"
    >
      {copied ? '복사됨!' : '링크 복사'}
    </button>
  );
}
