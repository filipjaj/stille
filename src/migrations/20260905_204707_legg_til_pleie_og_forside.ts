import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`frontpage\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`title\` text NOT NULL,
  	\`title_italic\` text,
  	\`lead\` text,
  	\`image_id\` integer,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`frontpage_image_idx\` ON \`frontpage\` (\`image_id\`);`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`care\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_care\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`frontpage\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`care\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_care\`;`)
}
