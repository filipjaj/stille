import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`transactions\` ADD \`payment_method\` text;`)
  await db.run(sql`ALTER TABLE \`transactions\` ADD \`stripe_customer_i_d\` text;`)
  await db.run(sql`ALTER TABLE \`transactions\` ADD \`stripe_payment_intent_i_d\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`transactions\` DROP COLUMN \`payment_method\`;`)
  await db.run(sql`ALTER TABLE \`transactions\` DROP COLUMN \`stripe_customer_i_d\`;`)
  await db.run(sql`ALTER TABLE \`transactions\` DROP COLUMN \`stripe_payment_intent_i_d\`;`)
}
