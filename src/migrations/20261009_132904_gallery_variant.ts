import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_page_gallery_variant" AS ENUM('immersive', 'split', 'mosaic');
  CREATE TYPE "public"."enum__home_page_v_version_gallery_variant" AS ENUM('immersive', 'split', 'mosaic');
  ALTER TABLE "home_page" ADD COLUMN "gallery_variant" "enum_home_page_gallery_variant" DEFAULT 'immersive';
  ALTER TABLE "_home_page_v" ADD COLUMN "version_gallery_variant" "enum__home_page_v_version_gallery_variant" DEFAULT 'immersive';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DROP COLUMN "gallery_variant";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_gallery_variant";
  DROP TYPE "public"."enum_home_page_gallery_variant";
  DROP TYPE "public"."enum__home_page_v_version_gallery_variant";`)
}
