import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sebi_disclosure_charter_items_kind" AS ENUM('item', 'subitem', 'heading');
  CREATE TYPE "public"."enum__sebi_disclosure_v_version_charter_items_kind" AS ENUM('item', 'subitem', 'heading');
  CREATE TABLE "sebi_disclosure_complaint_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"link_href" varchar
  );
  
  CREATE TABLE "sebi_disclosure_complaint_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source" varchar,
  	"pending_last_month" numeric DEFAULT 0,
  	"received" numeric DEFAULT 0,
  	"resolved" numeric DEFAULT 0,
  	"total_pending" numeric DEFAULT 0,
  	"pending_over3_months" numeric DEFAULT 0,
  	"avg_resolution_days" numeric DEFAULT 0
  );
  
  CREATE TABLE "sebi_disclosure_monthly_disposal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"period" varchar,
  	"carried_forward" numeric DEFAULT 0,
  	"received" numeric DEFAULT 0,
  	"resolved" numeric DEFAULT 0,
  	"pending" numeric DEFAULT 0
  );
  
  CREATE TABLE "sebi_disclosure_annual_disposal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"period" varchar,
  	"carried_forward" numeric DEFAULT 0,
  	"received" numeric DEFAULT 0,
  	"resolved" numeric DEFAULT 0,
  	"pending" numeric DEFAULT 0
  );
  
  CREATE TABLE "sebi_disclosure_escalation_matrix" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"designation" varchar,
  	"contact_person" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"working_hours" varchar
  );
  
  CREATE TABLE "sebi_disclosure_compliance_audits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"financial_year" varchar,
  	"status" varchar,
  	"remarks" varchar
  );
  
  CREATE TABLE "sebi_disclosure_charter_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"kind" "enum_sebi_disclosure_charter_items_kind" DEFAULT 'item'
  );
  
  CREATE TABLE "sebi_disclosure_charter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"intro" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_complaint_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_complaint_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source" varchar,
  	"pending_last_month" numeric DEFAULT 0,
  	"received" numeric DEFAULT 0,
  	"resolved" numeric DEFAULT 0,
  	"total_pending" numeric DEFAULT 0,
  	"pending_over3_months" numeric DEFAULT 0,
  	"avg_resolution_days" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_monthly_disposal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"period" varchar,
  	"carried_forward" numeric DEFAULT 0,
  	"received" numeric DEFAULT 0,
  	"resolved" numeric DEFAULT 0,
  	"pending" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_annual_disposal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"period" varchar,
  	"carried_forward" numeric DEFAULT 0,
  	"received" numeric DEFAULT 0,
  	"resolved" numeric DEFAULT 0,
  	"pending" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_escalation_matrix" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"designation" varchar,
  	"contact_person" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"working_hours" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_compliance_audits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"financial_year" varchar,
  	"status" varchar,
  	"remarks" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_charter_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"kind" "enum__sebi_disclosure_v_version_charter_items_kind" DEFAULT 'item',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_charter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"intro" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "footer_tagline" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_footer_tagline" varchar;
  ALTER TABLE "sebi_disclosure" ADD COLUMN "physical_complaints" varchar;
  ALTER TABLE "sebi_disclosure" ADD COLUMN "complaints_as_of" varchar;
  ALTER TABLE "_sebi_disclosure_v" ADD COLUMN "version_physical_complaints" varchar;
  ALTER TABLE "_sebi_disclosure_v" ADD COLUMN "version_complaints_as_of" varchar;
  ALTER TABLE "sebi_disclosure_complaint_steps" ADD CONSTRAINT "sebi_disclosure_complaint_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sebi_disclosure_complaint_rows" ADD CONSTRAINT "sebi_disclosure_complaint_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sebi_disclosure_monthly_disposal" ADD CONSTRAINT "sebi_disclosure_monthly_disposal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sebi_disclosure_annual_disposal" ADD CONSTRAINT "sebi_disclosure_annual_disposal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sebi_disclosure_escalation_matrix" ADD CONSTRAINT "sebi_disclosure_escalation_matrix_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sebi_disclosure_compliance_audits" ADD CONSTRAINT "sebi_disclosure_compliance_audits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sebi_disclosure_charter_items" ADD CONSTRAINT "sebi_disclosure_charter_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure_charter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sebi_disclosure_charter" ADD CONSTRAINT "sebi_disclosure_charter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_complaint_steps" ADD CONSTRAINT "_sebi_disclosure_v_version_complaint_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_complaint_rows" ADD CONSTRAINT "_sebi_disclosure_v_version_complaint_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_monthly_disposal" ADD CONSTRAINT "_sebi_disclosure_v_version_monthly_disposal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_annual_disposal" ADD CONSTRAINT "_sebi_disclosure_v_version_annual_disposal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_escalation_matrix" ADD CONSTRAINT "_sebi_disclosure_v_version_escalation_matrix_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_compliance_audits" ADD CONSTRAINT "_sebi_disclosure_v_version_compliance_audits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_charter_items" ADD CONSTRAINT "_sebi_disclosure_v_version_charter_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v_version_charter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_charter" ADD CONSTRAINT "_sebi_disclosure_v_version_charter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sebi_disclosure_complaint_steps_order_idx" ON "sebi_disclosure_complaint_steps" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_complaint_steps_parent_id_idx" ON "sebi_disclosure_complaint_steps" USING btree ("_parent_id");
  CREATE INDEX "sebi_disclosure_complaint_rows_order_idx" ON "sebi_disclosure_complaint_rows" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_complaint_rows_parent_id_idx" ON "sebi_disclosure_complaint_rows" USING btree ("_parent_id");
  CREATE INDEX "sebi_disclosure_monthly_disposal_order_idx" ON "sebi_disclosure_monthly_disposal" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_monthly_disposal_parent_id_idx" ON "sebi_disclosure_monthly_disposal" USING btree ("_parent_id");
  CREATE INDEX "sebi_disclosure_annual_disposal_order_idx" ON "sebi_disclosure_annual_disposal" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_annual_disposal_parent_id_idx" ON "sebi_disclosure_annual_disposal" USING btree ("_parent_id");
  CREATE INDEX "sebi_disclosure_escalation_matrix_order_idx" ON "sebi_disclosure_escalation_matrix" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_escalation_matrix_parent_id_idx" ON "sebi_disclosure_escalation_matrix" USING btree ("_parent_id");
  CREATE INDEX "sebi_disclosure_compliance_audits_order_idx" ON "sebi_disclosure_compliance_audits" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_compliance_audits_parent_id_idx" ON "sebi_disclosure_compliance_audits" USING btree ("_parent_id");
  CREATE INDEX "sebi_disclosure_charter_items_order_idx" ON "sebi_disclosure_charter_items" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_charter_items_parent_id_idx" ON "sebi_disclosure_charter_items" USING btree ("_parent_id");
  CREATE INDEX "sebi_disclosure_charter_order_idx" ON "sebi_disclosure_charter" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_charter_parent_id_idx" ON "sebi_disclosure_charter" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_complaint_steps_order_idx" ON "_sebi_disclosure_v_version_complaint_steps" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_complaint_steps_parent_id_idx" ON "_sebi_disclosure_v_version_complaint_steps" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_complaint_rows_order_idx" ON "_sebi_disclosure_v_version_complaint_rows" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_complaint_rows_parent_id_idx" ON "_sebi_disclosure_v_version_complaint_rows" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_monthly_disposal_order_idx" ON "_sebi_disclosure_v_version_monthly_disposal" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_monthly_disposal_parent_id_idx" ON "_sebi_disclosure_v_version_monthly_disposal" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_annual_disposal_order_idx" ON "_sebi_disclosure_v_version_annual_disposal" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_annual_disposal_parent_id_idx" ON "_sebi_disclosure_v_version_annual_disposal" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_escalation_matrix_order_idx" ON "_sebi_disclosure_v_version_escalation_matrix" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_escalation_matrix_parent_id_idx" ON "_sebi_disclosure_v_version_escalation_matrix" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_compliance_audits_order_idx" ON "_sebi_disclosure_v_version_compliance_audits" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_compliance_audits_parent_id_idx" ON "_sebi_disclosure_v_version_compliance_audits" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_charter_items_order_idx" ON "_sebi_disclosure_v_version_charter_items" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_charter_items_parent_id_idx" ON "_sebi_disclosure_v_version_charter_items" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_charter_order_idx" ON "_sebi_disclosure_v_version_charter" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_charter_parent_id_idx" ON "_sebi_disclosure_v_version_charter" USING btree ("_parent_id");
  ALTER TABLE "sebi_disclosure" DROP COLUMN "page_body";
  ALTER TABLE "_sebi_disclosure_v" DROP COLUMN "version_page_body";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "sebi_disclosure_complaint_steps" CASCADE;
  DROP TABLE "sebi_disclosure_complaint_rows" CASCADE;
  DROP TABLE "sebi_disclosure_monthly_disposal" CASCADE;
  DROP TABLE "sebi_disclosure_annual_disposal" CASCADE;
  DROP TABLE "sebi_disclosure_escalation_matrix" CASCADE;
  DROP TABLE "sebi_disclosure_compliance_audits" CASCADE;
  DROP TABLE "sebi_disclosure_charter_items" CASCADE;
  DROP TABLE "sebi_disclosure_charter" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_complaint_steps" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_complaint_rows" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_monthly_disposal" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_annual_disposal" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_escalation_matrix" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_compliance_audits" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_charter_items" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_charter" CASCADE;
  ALTER TABLE "sebi_disclosure" ADD COLUMN "page_body" jsonb;
  ALTER TABLE "_sebi_disclosure_v" ADD COLUMN "version_page_body" jsonb;
  ALTER TABLE "site_settings" DROP COLUMN "footer_tagline";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_footer_tagline";
  ALTER TABLE "sebi_disclosure" DROP COLUMN "physical_complaints";
  ALTER TABLE "sebi_disclosure" DROP COLUMN "complaints_as_of";
  ALTER TABLE "_sebi_disclosure_v" DROP COLUMN "version_physical_complaints";
  ALTER TABLE "_sebi_disclosure_v" DROP COLUMN "version_complaints_as_of";
  DROP TYPE "public"."enum_sebi_disclosure_charter_items_kind";
  DROP TYPE "public"."enum__sebi_disclosure_v_version_charter_items_kind";`)
}
