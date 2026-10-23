import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_page_highlights_variant" AS ENUM('checklist', 'solar', 'atom');
  CREATE TYPE "public"."enum__home_page_v_version_highlights_variant" AS ENUM('checklist', 'solar', 'atom');
  ALTER TABLE "home_page_highlights_items" ADD COLUMN "short_label" varchar;
  ALTER TABLE "home_page_highlights_items" ADD COLUMN "image_id" integer;
  ALTER TABLE "home_page" ADD COLUMN "highlights_variant" "enum_home_page_highlights_variant" DEFAULT 'checklist';
  ALTER TABLE "_home_page_v_version_highlights_items" ADD COLUMN "short_label" varchar;
  ALTER TABLE "_home_page_v_version_highlights_items" ADD COLUMN "image_id" integer;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_highlights_variant" "enum__home_page_v_version_highlights_variant" DEFAULT 'checklist';
  ALTER TABLE "home_page_highlights_items" ADD CONSTRAINT "home_page_highlights_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_highlights_items" ADD CONSTRAINT "_home_page_v_version_highlights_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_page_highlights_items_image_idx" ON "home_page_highlights_items" USING btree ("image_id");
  CREATE INDEX "_home_page_v_version_highlights_items_image_idx" ON "_home_page_v_version_highlights_items" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page_highlights_items" DROP CONSTRAINT "home_page_highlights_items_image_id_media_id_fk";
  
  ALTER TABLE "_home_page_v_version_highlights_items" DROP CONSTRAINT "_home_page_v_version_highlights_items_image_id_media_id_fk";
  
  DROP INDEX "home_page_highlights_items_image_idx";
  DROP INDEX "_home_page_v_version_highlights_items_image_idx";
  ALTER TABLE "home_page_highlights_items" DROP COLUMN "short_label";
  ALTER TABLE "home_page_highlights_items" DROP COLUMN "image_id";
  ALTER TABLE "home_page" DROP COLUMN "highlights_variant";
  ALTER TABLE "_home_page_v_version_highlights_items" DROP COLUMN "short_label";
  ALTER TABLE "_home_page_v_version_highlights_items" DROP COLUMN "image_id";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_highlights_variant";
  DROP TYPE "public"."enum_home_page_highlights_variant";
  DROP TYPE "public"."enum__home_page_v_version_highlights_variant";`)
}
