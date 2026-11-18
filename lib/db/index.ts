// DB 연결. 다른 파일에서는 `import { db } from '@/lib/db'` 로 가져다 써.
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
