'use client';
// 편집기: 입력값(state), 버튼 클릭, 파일 선택처럼 "브라우저에서 반응하는 것"이 많아서 클라이언트 컴포넌트
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { upload } from '@vercel/blob/client';
import { savePage } from '@/app/actions';
import Markdown from '@/components/markdown';
import { resizeImage } from '@/lib/resize-image';

type Props = {
  pageId: string;
  initialTitle: string;
  initialContent: string;
  baseVersion: number;
};

const PLACEHOLDER = `## 개요
대한민국의 ○○○이다.

## 생애
### 유년기

## 어록
> "오늘 진짜 일찍 잘 거야" - 매일 밤`;

export default function Editor({ pageId, initialTitle, initialContent, baseVersion }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // 커서 위치에 텍스트 끼워넣기
  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setContent((c) => c + text);
      return;
    }
    const { selectionStart: start, selectionEnd: end } = ta;
    setContent((c) => c.slice(0, start) + text + c.slice(end));
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const resized = await resizeImage(file); // 폰 사진 줄이기
      // 브라우저 → Vercel Blob으로 바로 업로드. 업로드 허가는 /api/upload에서 권한 확인 후 내줌
      const blob = await upload(`wiki/${pageId}/${resized.name}`, resized, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: JSON.stringify({ pageId }),
      });
      insertAtCursor(`\n![](${blob.url})\n`);
    } catch (err) {
      console.error(err);
      setError('이미지 업로드에 실패했어');
    } finally {
      setUploading(false);
      e.target.value = ''; // 같은 파일 다시 선택할 수 있게 초기화
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await savePage(pageId, title, content, baseVersion); // 서버 함수 호출!
      if ('error' in result) {
        setError(result.error);
      } else {
        router.push(`/w/${pageId}`);
      }
    });
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border-b-2 border-[#00a495] pb-2 text-3xl font-bold outline-none"
      />

      <div className="mt-4 flex items-center gap-2 text-sm">
        <button
          onClick={() => setTab('write')}
          className={`rounded px-3 py-1 ${tab === 'write' ? 'bg-gray-200 font-bold' : ''}`}
        >
          편집
        </button>
        <button
          onClick={() => setTab('preview')}
          className={`rounded px-3 py-1 ${tab === 'preview' ? 'bg-gray-200 font-bold' : ''}`}
        >
          미리보기
        </button>
        <label className="ml-auto cursor-pointer rounded border px-3 py-1 hover:bg-gray-50">
          {uploading ? '올리는 중...' : '🖼 이미지 넣기'}
          <input type="file" accept="image/*" hidden onChange={handleImage} disabled={uploading} />
        </label>
      </div>

      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          placeholder={PLACEHOLDER}
          className="mt-2 w-full rounded border p-3 font-mono text-sm leading-relaxed"
        />
      ) : (
        <div className="mt-2 min-h-96 rounded border p-4">
          <Markdown>{content || '_내용 없음_'}</Markdown>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-center justify-end gap-3">
        <Link href={`/w/${pageId}`} className="text-sm text-gray-600 hover:underline">
          취소
        </Link>
        <button
          onClick={handleSave}
          disabled={isPending || uploading}
          className="rounded bg-black px-5 py-2 text-white disabled:opacity-50"
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </main>
  );
}
