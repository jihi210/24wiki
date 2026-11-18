// 업로드 전에 브라우저에서 사진 크기 줄이기 (긴 변 1600px, webp)
// 폰 사진 3~5MB → 보통 200~400KB 정도로 줄어들어서 무료 용량 아끼기 좋아.
export async function resizeImage(file: File, maxSize = 1600, quality = 0.85): Promise<File> {
  if (file.type === 'image/gif') return file; // 움짤은 그대로

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 변환 실패'))), 'image/webp', quality),
  );

  return new File([blob], `${crypto.randomUUID()}.webp`, { type: 'image/webp' });
}
