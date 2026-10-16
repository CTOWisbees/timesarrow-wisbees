import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ALTER COLUMN "book_call_submit_label" SET DEFAULT 'Book a call';
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_book_call_submit_label" SET DEFAULT 'Book a call';
  ALTER TABLE "bookings" ADD COLUMN "slot_token_hash" varchar;
  ALTER TABLE "home_page" ADD COLUMN "book_call_slot_step_title" varchar DEFAULT 'Pick a time that suits you';
  ALTER TABLE "home_page" ADD COLUMN "book_call_slot_step_description" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_book_call_slot_step_title" varchar DEFAULT 'Pick a time that suits you';
  ALTER TABLE "_home_page_v" ADD COLUMN "version_book_call_slot_step_description" varchar;
  CREATE INDEX "bookings_slot_token_hash_idx" ON "bookings" USING btree ("slot_token_hash");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "bookings_slot_token_hash_idx";
  ALTER TABLE "home_page" ALTER COLUMN "book_call_submit_label" SET DEFAULT 'Submit to book a call';
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_book_call_submit_label" SET DEFAULT 'Submit to book a call';
  ALTER TABLE "bookings" DROP COLUMN "slot_token_hash";
  ALTER TABLE "home_page" DROP COLUMN "book_call_slot_step_title";
  ALTER TABLE "home_page" DROP COLUMN "book_call_slot_step_description";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_book_call_slot_step_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_book_call_slot_step_description";`)
}
