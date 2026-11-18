# 생일 위키 세팅 순서

## 1. 패키지 설치
```bash
npm install @neon/auth@latest drizzle-orm @neondatabase/serverless @vercel/blob react-markdown remark-gfm
npm install -D drizzle-kit dotenv
```

## 2. 파일 복사
이 폴더의 `app/`, `components/`, `lib/`, `drizzle.config.ts`를 프로젝트 루트에 복사한다.
- `app/page.tsx`는 기존 파일을 덮어쓴다.
- `app/layout.tsx` 맨 위에 `import './wiki.css';`를 추가한다.
- 프로젝트를 만들 때 `src/` 폴더 옵션을 골랐다면 `app/`, `components/`, `lib/`를 `src/` 안에 넣고, `drizzle.config.ts`의 schema 경로를 `./src/lib/db/schema.ts`로 바꾼다.

## 3. 환경변수
`.env.example`을 `.env.local`로 복사하고 값을 채운다.
- **DATABASE_URL**: Neon 콘솔 → 프로젝트 → Connect
- **NEON_AUTH_BASE_URL**: Neon 콘솔 → Auth → Enable Auth → Settings
- **NEON_AUTH_COOKIE_SECRET**: `openssl rand -base64 32`
- **BLOB_READ_WRITE_TOKEN**: Vercel에 프로젝트를 먼저 import한 뒤 Storage → Create → Blob → 토큰 복사
  (또는 `npx vercel link` 후 `npx vercel env pull .env.local`)

## 4. DB 테이블 만들기
```bash
npx drizzle-kit push
```
Neon 콘솔 → Tables에서 pages, members 등이 생겼는지 확인한다.
(Neon Auth 테이블은 `neon_auth` 스키마에 따로 있어서 건드리지 않는다.)

## 5. 실행
```bash
npm run dev
```
http://localhost:3000 → 구글 로그인 → 문서 만들기 → 편집 → 이미지 넣기 → 설정에서 초대 링크 만들기.
Safari에서 로그인이 안 되면 `npm run dev -- --experimental-https`로 실행하고 https://localhost:3000 으로 연다.

## 6. 배포
1. GitHub에 push (`.env.local`이 `.gitignore`에 있는지 확인)
2. Vercel → Add New → Project → 레포 Import
3. Environment Variables에 `.env.local` 값 4개를 입력하고 Deploy
4. 배포 주소(`xxx.vercel.app`)를 Neon Auth 설정의 허용 도메인(trusted domains)에 추가
5. 구글 로그인: 개발 중에는 Neon 공용 키로 되지만, 배포 후에는 Google Cloud Console에서 OAuth 클라이언트를 만들어 Neon Auth에 등록해야 한다.
   이때 Google에 등록할 리디렉션 URI는 `{NEON_AUTH_BASE_URL}/callback/google`이다.
