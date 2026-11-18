'use client';
// 브라우저에서 쓰는 인증 객체 (로그인 버튼, 로그아웃 버튼에서 사용)
import { createAuthClient } from '@neon/auth/next';

export const authClient = createAuthClient();
