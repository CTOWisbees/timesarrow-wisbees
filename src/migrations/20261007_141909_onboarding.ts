import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_applications_income_range" AS ENUM('under_5l', '5l_10l', '10l_25l', '25l_50l', '50l_1cr', 'above_1cr');
  CREATE TYPE "public"."enum_applications_goal" AS ENUM('wealth', 'retirement', 'child', 'home', 'income', 'other');
  CREATE TYPE "public"."enum_applications_horizon" AS ENUM('lt_3y', '3_5y', '5_10y', 'gt_10y');
  CREATE TYPE "public"."enum_applications_risk" AS ENUM('conservative', 'moderate', 'aggressive');
  CREATE TYPE "public"."enum_applications_status" AS ENUM('profile_pending', 'submitted', 'contacted', 'approved', 'rejected');
  CREATE TYPE "public"."enum_applications_auth_provider" AS ENUM('email', 'google');
  CREATE TYPE "public"."enum_onboarding_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__onboarding_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"pan" varchar,
  	"date_of_birth" timestamp(3) with time zone,
  	"city" varchar,
  	"income_range" "enum_applications_income_range",
  	"goal" "enum_applications_goal",
  	"horizon" "enum_applications_horizon",
  	"risk" "enum_applications_risk",
  	"status" "enum_applications_status" DEFAULT 'profile_pending' NOT NULL,
  	"submitted_at" timestamp(3) with time zone,
  	"internal_notes" varchar,
  	"supabase_user_id" varchar NOT NULL,
  	"auth_provider" "enum_applications_auth_provider",
  	"consent_text" varchar,
  	"consent_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "onboarding" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_headline" varchar,
  	"brand_message" varchar,
  	"brand_illustration_id" integer,
  	"account_sign_up_title" varchar,
  	"account_sign_up_description" varchar,
  	"account_log_in_title" varchar,
  	"account_log_in_description" varchar,
  	"account_consent_text" varchar,
  	"verify_verify_title" varchar,
  	"verify_verify_description" varchar,
  	"verify_profile_title" varchar,
  	"verify_profile_description" varchar,
  	"verify_profile_note" varchar,
  	"review_title" varchar,
  	"review_message" varchar,
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"_status" "enum_onboarding_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_onboarding_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_brand_headline" varchar,
  	"version_brand_message" varchar,
  	"version_brand_illustration_id" integer,
  	"version_account_sign_up_title" varchar,
  	"version_account_sign_up_description" varchar,
  	"version_account_log_in_title" varchar,
  	"version_account_log_in_description" varchar,
  	"version_account_consent_text" varchar,
  	"version_verify_verify_title" varchar,
  	"version_verify_verify_description" varchar,
  	"version_verify_profile_title" varchar,
  	"version_verify_profile_description" varchar,
  	"version_verify_profile_note" varchar,
  	"version_review_title" varchar,
  	"version_review_message" varchar,
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version__status" "enum__onboarding_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "applications_id" integer;
  ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_brand_illustration_id_media_id_fk" FOREIGN KEY ("brand_illustration_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_onboarding_v" ADD CONSTRAINT "_onboarding_v_version_brand_illustration_id_media_id_fk" FOREIGN KEY ("version_brand_illustration_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "applications_supabase_user_id_idx" ON "applications" USING btree ("supabase_user_id");
  CREATE INDEX "applications_updated_at_idx" ON "applications" USING btree ("updated_at");
  CREATE INDEX "applications_created_at_idx" ON "applications" USING btree ("created_at");
  CREATE INDEX "onboarding_brand_brand_illustration_idx" ON "onboarding" USING btree ("brand_illustration_id");
  CREATE INDEX "onboarding__status_idx" ON "onboarding" USING btree ("_status");
  CREATE INDEX "_onboarding_v_version_brand_version_brand_illustration_idx" ON "_onboarding_v" USING btree ("version_brand_illustration_id");
  CREATE INDEX "_onboarding_v_version_version__status_idx" ON "_onboarding_v" USING btree ("version__status");
  CREATE INDEX "_onboarding_v_created_at_idx" ON "_onboarding_v" USING btree ("created_at");
  CREATE INDEX "_onboarding_v_updated_at_idx" ON "_onboarding_v" USING btree ("updated_at");
  CREATE INDEX "_onboarding_v_latest_idx" ON "_onboarding_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_applications_fk" FOREIGN KEY ("applications_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("applications_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "onboarding" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_onboarding_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "applications" CASCADE;
  DROP TABLE "onboarding" CASCADE;
  DROP TABLE "_onboarding_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_applications_fk";
  
  DROP INDEX "payload_locked_documents_rels_applications_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "applications_id";
  DROP TYPE "public"."enum_applications_income_range";
  DROP TYPE "public"."enum_applications_goal";
  DROP TYPE "public"."enum_applications_horizon";
  DROP TYPE "public"."enum_applications_risk";
  DROP TYPE "public"."enum_applications_status";
  DROP TYPE "public"."enum_applications_auth_provider";
  DROP TYPE "public"."enum_onboarding_status";
  DROP TYPE "public"."enum__onboarding_v_version_status";`)
}
