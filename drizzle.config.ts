// drizzle-kit 설정. `npx drizzle-kit push` 할 때 이 파일을 읽어.
// (drizzle-kit은 .env.local을 자동으로 안 읽어서 dotenv로 불러와)
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
