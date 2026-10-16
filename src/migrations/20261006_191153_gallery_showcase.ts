import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "gallery_items" ADD COLUMN "description" varchar;
  ALTER TABLE "gallery_items" ADD COLUMN "location" varchar;
  ALTER TABLE "_gallery_items_v" ADD COLUMN "version_description" varchar;
  ALTER TABLE "_gallery_items_v" ADD COLUMN "version_location" varchar;
  ALTER TABLE "home_page" ADD COLUMN "gallery_autoplay_seconds" numeric DEFAULT 6;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_gallery_autoplay_seconds" numeric DEFAULT 6;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "gallery_items" DROP COLUMN "description";
  ALTER TABLE "gallery_items" DROP COLUMN "location";
  ALTER TABLE "_gallery_items_v" DROP COLUMN "version_description";
  ALTER TABLE "_gallery_items_v" DROP COLUMN "version_location";
  ALTER TABLE "home_page" DROP COLUMN "gallery_autoplay_seconds";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_gallery_autoplay_seconds";`)
}
