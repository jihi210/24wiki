'use client';

import { useActionState, useState } from 'react';
import { createPage } from '@/app/actions';
import { toSlug } from '@/lib/slug';

export default function CreatePageForm() {
  // state: 서버가 돌려준 값 ({ error } 또는 null)
  // formAction: <form action={...}>에 넣을 함수
  // isPending: 제출 중인지
  const [state, formAction, isPending] = useActionState(createPage, null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  // TODO 1: 미리보기에 보여줄 주소 만들기
  //   slug에 뭔가 썼으면 그걸, 비어 있으면 title로 자동 생성한 값
  const previewSlug = slug || toSlug(title)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && !slug) {
        setSlug(previewSlug)
    }
  }
  
  return (
    <form action={formAction} className="mb-8 space-y-2">
      <div className="flex gap-2">
        <input
          name="title"            // ← 서버의 formData.get('title')이랑 이름이 같아야 해
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="새 문서 제목 (예: 홍길동)"
          required
          className="flex-1 rounded border px-3 py-2"
        />
        {/* TODO 2: 제출 중이면 버튼을 비활성화하고 글자를 '만드는 중...'으로 */}
        <button 
            disabled={isPending} 
            className="rounded bg-black px-4 py-2 text-white"
        >
            {isPending ? '만들기' : '만드는 중...'}
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">/docs/</span>
        <input
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={toSlug(title)}
          className="flex-1 rounded border px-2 py-1"
        />
      </div>

      {previewSlug && state?.error ? (
        <p className="text-xs text-red-500">
            {state.error} 
        </p>) : (<p className="text-xs text-gray-500">
            주소: /docs/{previewSlug}
        </p>
      )}

    </form>
  );
}