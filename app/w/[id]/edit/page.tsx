// 편집 페이지: 권한 확인과 데이터 조회는 서버에서, 실제 편집 UI는 클라이언트 컴포넌트(Editor)에서
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { requireRole } from '@/lib/permissions';
import Editor from '@/components/editor';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole(id, 'editor');

  const page = await db.query.pages.findFirst({ where: eq(pages.id, id) });
  if (!page) notFound();

  return (
    <Editor
      pageId={id}
      initialTitle={page.title}
      initialContent={page.content}
      baseVersion={page.version}
    />
  );
}
