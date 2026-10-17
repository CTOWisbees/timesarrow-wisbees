import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_home_page_gallery_variant" ADD VALUE 'collage';
  ALTER TYPE "public"."enum__home_page_v_version_gallery_variant" ADD VALUE 'collage';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ALTER COLUMN "gallery_variant" SET DATA TYPE text;
  ALTER TABLE "home_page" ALTER COLUMN "gallery_variant" SET DEFAULT 'immersive'::text;
  DROP TYPE "public"."enum_home_page_gallery_variant";
  CREATE TYPE "public"."enum_home_page_gallery_variant" AS ENUM('immersive', 'split', 'mosaic');
  ALTER TABLE "home_page" ALTER COLUMN "gallery_variant" SET DEFAULT 'immersive'::"public"."enum_home_page_gallery_variant";
  ALTER TABLE "home_page" ALTER COLUMN "gallery_variant" SET DATA TYPE "public"."enum_home_page_gallery_variant" USING "gallery_variant"::"public"."enum_home_page_gallery_variant";
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_gallery_variant" SET DATA TYPE text;
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_gallery_variant" SET DEFAULT 'immersive'::text;
  DROP TYPE "public"."enum__home_page_v_version_gallery_variant";
  CREATE TYPE "public"."enum__home_page_v_version_gallery_variant" AS ENUM('immersive', 'split', 'mosaic');
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_gallery_variant" SET DEFAULT 'immersive'::"public"."enum__home_page_v_version_gallery_variant";
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_gallery_variant" SET DATA TYPE "public"."enum__home_page_v_version_gallery_variant" USING "version_gallery_variant"::"public"."enum__home_page_v_version_gallery_variant";`)
}
