import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_page_book_call_field_icons" AS ENUM('name', 'email', 'phone', 'day', 'time');
  CREATE TYPE "public"."enum_home_page_book_call_ms_bookings_display" AS ENUM('embed', 'link');
  CREATE TYPE "public"."enum__home_page_v_version_book_call_field_icons" AS ENUM('name', 'email', 'phone', 'day', 'time');
  CREATE TYPE "public"."enum__home_page_v_version_book_call_ms_bookings_display" AS ENUM('embed', 'link');
  ALTER TYPE "public"."enum_home_page_book_call_variant" ADD VALUE 'ms-bookings';
  ALTER TYPE "public"."enum__home_page_v_version_book_call_variant" ADD VALUE 'ms-bookings';
  CREATE TABLE "home_page_book_call_field_icons" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_home_page_book_call_field_icons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_book_call_field_icons" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__home_page_v_version_book_call_field_icons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "home_page" ADD COLUMN "book_call_ms_bookings_url" varchar;
  ALTER TABLE "home_page" ADD COLUMN "book_call_ms_bookings_display" "enum_home_page_book_call_ms_bookings_display" DEFAULT 'embed';
  ALTER TABLE "home_page" ADD COLUMN "book_call_ms_bookings_link_label" varchar DEFAULT 'Open the booking page';
  ALTER TABLE "home_page" ADD COLUMN "book_call_ms_bookings_note" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_book_call_ms_bookings_url" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_book_call_ms_bookings_display" "enum__home_page_v_version_book_call_ms_bookings_display" DEFAULT 'embed';
  ALTER TABLE "_home_page_v" ADD COLUMN "version_book_call_ms_bookings_link_label" varchar DEFAULT 'Open the booking page';
  ALTER TABLE "_home_page_v" ADD COLUMN "version_book_call_ms_bookings_note" varchar;
  ALTER TABLE "home_page_book_call_field_icons" ADD CONSTRAINT "home_page_book_call_field_icons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_book_call_field_icons" ADD CONSTRAINT "_home_page_v_version_book_call_field_icons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_book_call_field_icons_order_idx" ON "home_page_book_call_field_icons" USING btree ("order");
  CREATE INDEX "home_page_book_call_field_icons_parent_idx" ON "home_page_book_call_field_icons" USING btree ("parent_id");
  CREATE INDEX "_home_page_v_version_book_call_field_icons_order_idx" ON "_home_page_v_version_book_call_field_icons" USING btree ("order");
  CREATE INDEX "_home_page_v_version_book_call_field_icons_parent_idx" ON "_home_page_v_version_book_call_field_icons" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_page_book_call_field_icons" CASCADE;
  DROP TABLE "_home_page_v_version_book_call_field_icons" CASCADE;
  ALTER TABLE "home_page" ALTER COLUMN "book_call_variant" SET DATA TYPE text;
  ALTER TABLE "home_page" ALTER COLUMN "book_call_variant" SET DEFAULT 'two-step'::text;
  DROP TYPE "public"."enum_home_page_book_call_variant";
  CREATE TYPE "public"."enum_home_page_book_call_variant" AS ENUM('two-step', 'one-step', 'slot-first');
  ALTER TABLE "home_page" ALTER COLUMN "book_call_variant" SET DEFAULT 'two-step'::"public"."enum_home_page_book_call_variant";
  ALTER TABLE "home_page" ALTER COLUMN "book_call_variant" SET DATA TYPE "public"."enum_home_page_book_call_variant" USING "book_call_variant"::"public"."enum_home_page_book_call_variant";
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_book_call_variant" SET DATA TYPE text;
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_book_call_variant" SET DEFAULT 'two-step'::text;
  DROP TYPE "public"."enum__home_page_v_version_book_call_variant";
  CREATE TYPE "public"."enum__home_page_v_version_book_call_variant" AS ENUM('two-step', 'one-step', 'slot-first');
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_book_call_variant" SET DEFAULT 'two-step'::"public"."enum__home_page_v_version_book_call_variant";
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_book_call_variant" SET DATA TYPE "public"."enum__home_page_v_version_book_call_variant" USING "version_book_call_variant"::"public"."enum__home_page_v_version_book_call_variant";
  ALTER TABLE "home_page" DROP COLUMN "book_call_ms_bookings_url";
  ALTER TABLE "home_page" DROP COLUMN "book_call_ms_bookings_display";
  ALTER TABLE "home_page" DROP COLUMN "book_call_ms_bookings_link_label";
  ALTER TABLE "home_page" DROP COLUMN "book_call_ms_bookings_note";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_book_call_ms_bookings_url";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_book_call_ms_bookings_display";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_book_call_ms_bookings_link_label";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_book_call_ms_bookings_note";
  DROP TYPE "public"."enum_home_page_book_call_field_icons";
  DROP TYPE "public"."enum_home_page_book_call_ms_bookings_display";
  DROP TYPE "public"."enum__home_page_v_version_book_call_field_icons";
  DROP TYPE "public"."enum__home_page_v_version_book_call_ms_bookings_display";`)
}
