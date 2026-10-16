import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page_book_call_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_book_call_benefits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_page_book_call_benefits" CASCADE;
  DROP TABLE "_home_page_v_version_book_call_benefits" CASCADE;
  ALTER TABLE "bookings" ADD COLUMN "full_name" varchar;
  UPDATE "bookings" SET "full_name" = trim(concat_ws(' ', "first_name", "last_name"));
  ALTER TABLE "bookings" ALTER COLUMN "full_name" SET NOT NULL;
  ALTER TABLE "home_page" ADD COLUMN "book_call_illustration_id" integer;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_book_call_illustration_id" integer;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_book_call_illustration_id_media_id_fk" FOREIGN KEY ("book_call_illustration_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_book_call_illustration_id_media_id_fk" FOREIGN KEY ("version_book_call_illustration_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_page_book_call_book_call_illustration_idx" ON "home_page" USING btree ("book_call_illustration_id");
  CREATE INDEX "_home_page_v_version_book_call_version_book_call_illustr_idx" ON "_home_page_v" USING btree ("version_book_call_illustration_id");
  ALTER TABLE "bookings" DROP COLUMN "first_name";
  ALTER TABLE "bookings" DROP COLUMN "last_name";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_page_book_call_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_home_page_v_version_book_call_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "home_page" DROP CONSTRAINT "home_page_book_call_illustration_id_media_id_fk";
  
  ALTER TABLE "_home_page_v" DROP CONSTRAINT "_home_page_v_version_book_call_illustration_id_media_id_fk";
  
  DROP INDEX "home_page_book_call_book_call_illustration_idx";
  DROP INDEX "_home_page_v_version_book_call_version_book_call_illustr_idx";
  ALTER TABLE "bookings" ADD COLUMN "first_name" varchar;
  ALTER TABLE "bookings" ADD COLUMN "last_name" varchar;
  UPDATE "bookings" SET "first_name" = split_part("full_name", ' ', 1),
    "last_name" = coalesce(nullif(trim(substr("full_name", length(split_part("full_name", ' ', 1)) + 1)), ''), '-');
  ALTER TABLE "bookings" ALTER COLUMN "first_name" SET NOT NULL;
  ALTER TABLE "bookings" ALTER COLUMN "last_name" SET NOT NULL;
  ALTER TABLE "home_page_book_call_benefits" ADD CONSTRAINT "home_page_book_call_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_book_call_benefits" ADD CONSTRAINT "_home_page_v_version_book_call_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_book_call_benefits_order_idx" ON "home_page_book_call_benefits" USING btree ("_order");
  CREATE INDEX "home_page_book_call_benefits_parent_id_idx" ON "home_page_book_call_benefits" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_book_call_benefits_order_idx" ON "_home_page_v_version_book_call_benefits" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_book_call_benefits_parent_id_idx" ON "_home_page_v_version_book_call_benefits" USING btree ("_parent_id");
  ALTER TABLE "bookings" DROP COLUMN "full_name";
  ALTER TABLE "home_page" DROP COLUMN "book_call_illustration_id";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_book_call_illustration_id";`)
}
