import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DROP CONSTRAINT "home_page_gallery_background_image_id_media_id_fk";
  
  ALTER TABLE "_home_page_v" DROP CONSTRAINT "_home_page_v_version_gallery_background_image_id_media_id_fk";
  
  DROP INDEX "home_page_gallery_gallery_background_image_idx";
  DROP INDEX "_home_page_v_version_gallery_version_gallery_background__idx";
  ALTER TABLE "home_page" DROP COLUMN "gallery_background_image_id";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_gallery_background_image_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ADD COLUMN "gallery_background_image_id" integer;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_gallery_background_image_id" integer;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_gallery_background_image_id_media_id_fk" FOREIGN KEY ("gallery_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_gallery_background_image_id_media_id_fk" FOREIGN KEY ("version_gallery_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_page_gallery_gallery_background_image_idx" ON "home_page" USING btree ("gallery_background_image_id");
  CREATE INDEX "_home_page_v_version_gallery_version_gallery_background__idx" ON "_home_page_v" USING btree ("version_gallery_background_image_id");`)
}
