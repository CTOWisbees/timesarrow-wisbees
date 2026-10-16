import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_page_book_call_variant" AS ENUM('two-step', 'one-step', 'slot-first');
  CREATE TYPE "public"."enum__home_page_v_version_book_call_variant" AS ENUM('two-step', 'one-step', 'slot-first');
  ALTER TABLE "home_page" ADD COLUMN "book_call_variant" "enum_home_page_book_call_variant" DEFAULT 'two-step';
  ALTER TABLE "_home_page_v" ADD COLUMN "version_book_call_variant" "enum__home_page_v_version_book_call_variant" DEFAULT 'two-step';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DROP COLUMN "book_call_variant";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_book_call_variant";
  DROP TYPE "public"."enum_home_page_book_call_variant";
  DROP TYPE "public"."enum__home_page_v_version_book_call_variant";`)
}
