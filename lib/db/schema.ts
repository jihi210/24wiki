// DB 테이블 정의 (Drizzle ORM)
// 여기를 고친 뒤 `npx drizzle-kit push` 하면 Neon DB에 그대로 반영돼.
import { pgTable, uuid, text, integer, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';

// 위키 문서
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull().default(''), // 마크다운 원문
  version: integer('version').notNull().default(1), // 저장할 때마다 +1 (동시 편집 충돌 감지용)
  createdBy: text('created_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  isPublic: boolean('is_public').notNull().default(false),
  slug: text('slug').unique()
});

// 편집 기록 (나무위키의 "역사")
export const revisions = pgTable('revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: text('content').notNull(),
  editedBy: text('edited_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 문서별 멤버와 권한
export const members = pgTable(
  'members',
  {
    pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
    email: text('email').notNull(), // 항상 소문자로 저장
    role: text('role', { enum: ['viewer', 'editor', 'owner'] }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.pageId, t.email] })],
);

// 초대 링크
export const inviteLinks = pgTable('invite_links', {
  token: text('token').primaryKey(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['viewer', 'editor'] }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revoked: boolean('revoked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 차단 목록 (생일 당사자!)
export const blockedEmails = pgTable(
  'blocked_emails',
  {
    pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
  },
  (t) => [primaryKey({ columns: [t.pageId, t.email] })],
);
