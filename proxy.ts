// proxy.ts: Neon 공식 퀵스타트에 포함된 미들웨어 설정
// 매 요청마다 세션 쿠키를 검증하고, 서버 컴포넌트에 세션 데이터를 넘기고, 로그인 안 한 사용자를 로그인 페이지로 보내며 필요하면 세션 토큰 갱신
import { auth } from '@/lib/auth/server';

export default auth.middleware({
  loginUrl: '/login',
  // 로그인 안 해도 들어올 수 있는 경로 (각 페이지에서 알아서 처리함)
  publicRoutes: ['/login', '/invite', '/docs', '/api/auth', '/api/upload'],
});

export const config = {
  // 이미지나 정적 파일을 빼고 모든 요청에 실행
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};