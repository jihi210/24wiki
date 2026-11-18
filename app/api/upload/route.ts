// 이미지 업로드 허가증(토큰) 발급소.
// 브라우저가 "이 문서에 이미지 올려도 돼?" 물어보면, 편집 권한이 있을 때만 토큰을 내줘.
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/permissions';

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const { pageId } = JSON.parse(clientPayload ?? '{}') as { pageId?: string };
        await requireRole(pageId ?? '', 'editor'); // ⭐ 권한 없으면 여기서 막힘

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // 업로드 완료 후 처리할 게 있으면 여기에 (localhost에서는 호출 안 됨)
      },
    });
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: '업로드 권한이 없거나 실패했어' }, { status: 400 });
  }
}
