import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bookings" ADD COLUMN "preferred_at" timestamp(3) with time zone;
  CREATE INDEX "bookings_preferred_at_idx" ON "bookings" USING btree ("preferred_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "bookings_preferred_at_idx";
  ALTER TABLE "bookings" DROP COLUMN "preferred_at";`)
}
