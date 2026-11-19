// 로그인/로그아웃/세션 요청을 Neon Auth로 넘겨주는 통로.
import { auth } from '@/lib/auth/server';

export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();
