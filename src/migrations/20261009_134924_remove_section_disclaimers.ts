import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DROP COLUMN "hero_disclaimer";
  ALTER TABLE "home_page" DROP COLUMN "calculator_disclaimer";
  ALTER TABLE "home_page" DROP COLUMN "portfolios_disclaimer";
  ALTER TABLE "home_page" DROP COLUMN "faq_eyebrow";
  ALTER TABLE "home_page" DROP COLUMN "book_call_eyebrow";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_disclaimer";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_calculator_disclaimer";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_portfolios_disclaimer";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_faq_eyebrow";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_book_call_eyebrow";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ADD COLUMN "hero_disclaimer" varchar;
  ALTER TABLE "home_page" ADD COLUMN "calculator_disclaimer" varchar;
  ALTER TABLE "home_page" ADD COLUMN "portfolios_disclaimer" varchar;
  ALTER TABLE "home_page" ADD COLUMN "faq_eyebrow" varchar;
  ALTER TABLE "home_page" ADD COLUMN "book_call_eyebrow" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_disclaimer" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_calculator_disclaimer" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_portfolios_disclaimer" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_faq_eyebrow" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_book_call_eyebrow" varchar;`)
}
