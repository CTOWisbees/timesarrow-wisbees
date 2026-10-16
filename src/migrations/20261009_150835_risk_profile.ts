import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_onboarding_verify_layout" AS ENUM('focus', 'single-page', 'conversation');
  CREATE TYPE "public"."enum__onboarding_v_version_verify_layout" AS ENUM('focus', 'single-page', 'conversation');
  CREATE TYPE "public"."enum_risk_profile_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__risk_profile_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "applications_risk_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question_key" varchar,
  	"question" varchar,
  	"answer" varchar,
  	"score" numeric
  );
  
  CREATE TABLE "risk_profile_questions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"score" numeric
  );
  
  CREATE TABLE "risk_profile_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"question" varchar,
  	"help" varchar
  );
  
  CREATE TABLE "risk_profile_bands" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"min" numeric,
  	"max" numeric,
  	"category" varchar,
  	"equity_limit" varchar
  );
  
  CREATE TABLE "risk_profile" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"submit_label" varchar DEFAULT 'Submit application',
  	"description" varchar,
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"_status" "enum_risk_profile_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_risk_profile_v_version_questions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"score" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_risk_profile_v_version_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"question" varchar,
  	"help" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_risk_profile_v_version_bands" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"min" numeric,
  	"max" numeric,
  	"category" varchar,
  	"equity_limit" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_risk_profile_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar,
  	"version_submit_label" varchar DEFAULT 'Submit application',
  	"version_description" varchar,
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version__status" "enum__risk_profile_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "applications" ADD COLUMN "risk_category" varchar;
  ALTER TABLE "applications" ADD COLUMN "risk_score" numeric;
  ALTER TABLE "applications" ADD COLUMN "equity_limit" varchar;
  ALTER TABLE "applications" ADD COLUMN "questionnaire_version" timestamp(3) with time zone;
  ALTER TABLE "onboarding" ADD COLUMN "verify_layout" "enum_onboarding_verify_layout" DEFAULT 'focus';
  ALTER TABLE "_onboarding_v" ADD COLUMN "version_verify_layout" "enum__onboarding_v_version_verify_layout" DEFAULT 'focus';
  ALTER TABLE "applications_risk_answers" ADD CONSTRAINT "applications_risk_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "risk_profile_questions_answers" ADD CONSTRAINT "risk_profile_questions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."risk_profile_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "risk_profile_questions" ADD CONSTRAINT "risk_profile_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."risk_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "risk_profile_bands" ADD CONSTRAINT "risk_profile_bands_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."risk_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_risk_profile_v_version_questions_answers" ADD CONSTRAINT "_risk_profile_v_version_questions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_risk_profile_v_version_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_risk_profile_v_version_questions" ADD CONSTRAINT "_risk_profile_v_version_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_risk_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_risk_profile_v_version_bands" ADD CONSTRAINT "_risk_profile_v_version_bands_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_risk_profile_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "applications_risk_answers_order_idx" ON "applications_risk_answers" USING btree ("_order");
  CREATE INDEX "applications_risk_answers_parent_id_idx" ON "applications_risk_answers" USING btree ("_parent_id");
  CREATE INDEX "risk_profile_questions_answers_order_idx" ON "risk_profile_questions_answers" USING btree ("_order");
  CREATE INDEX "risk_profile_questions_answers_parent_id_idx" ON "risk_profile_questions_answers" USING btree ("_parent_id");
  CREATE INDEX "risk_profile_questions_order_idx" ON "risk_profile_questions" USING btree ("_order");
  CREATE INDEX "risk_profile_questions_parent_id_idx" ON "risk_profile_questions" USING btree ("_parent_id");
  CREATE INDEX "risk_profile_bands_order_idx" ON "risk_profile_bands" USING btree ("_order");
  CREATE INDEX "risk_profile_bands_parent_id_idx" ON "risk_profile_bands" USING btree ("_parent_id");
  CREATE INDEX "risk_profile__status_idx" ON "risk_profile" USING btree ("_status");
  CREATE INDEX "_risk_profile_v_version_questions_answers_order_idx" ON "_risk_profile_v_version_questions_answers" USING btree ("_order");
  CREATE INDEX "_risk_profile_v_version_questions_answers_parent_id_idx" ON "_risk_profile_v_version_questions_answers" USING btree ("_parent_id");
  CREATE INDEX "_risk_profile_v_version_questions_order_idx" ON "_risk_profile_v_version_questions" USING btree ("_order");
  CREATE INDEX "_risk_profile_v_version_questions_parent_id_idx" ON "_risk_profile_v_version_questions" USING btree ("_parent_id");
  CREATE INDEX "_risk_profile_v_version_bands_order_idx" ON "_risk_profile_v_version_bands" USING btree ("_order");
  CREATE INDEX "_risk_profile_v_version_bands_parent_id_idx" ON "_risk_profile_v_version_bands" USING btree ("_parent_id");
  CREATE INDEX "_risk_profile_v_version_version__status_idx" ON "_risk_profile_v" USING btree ("version__status");
  CREATE INDEX "_risk_profile_v_created_at_idx" ON "_risk_profile_v" USING btree ("created_at");
  CREATE INDEX "_risk_profile_v_updated_at_idx" ON "_risk_profile_v" USING btree ("updated_at");
  CREATE INDEX "_risk_profile_v_latest_idx" ON "_risk_profile_v" USING btree ("latest");
  ALTER TABLE "applications" DROP COLUMN "income_range";
  ALTER TABLE "applications" DROP COLUMN "goal";
  ALTER TABLE "applications" DROP COLUMN "horizon";
  ALTER TABLE "applications" DROP COLUMN "risk";
  ALTER TABLE "onboarding" DROP COLUMN "verify_profile_title";
  ALTER TABLE "onboarding" DROP COLUMN "verify_profile_description";
  ALTER TABLE "onboarding" DROP COLUMN "verify_profile_note";
  ALTER TABLE "_onboarding_v" DROP COLUMN "version_verify_profile_title";
  ALTER TABLE "_onboarding_v" DROP COLUMN "version_verify_profile_description";
  ALTER TABLE "_onboarding_v" DROP COLUMN "version_verify_profile_note";
  DROP TYPE "public"."enum_applications_income_range";
  DROP TYPE "public"."enum_applications_goal";
  DROP TYPE "public"."enum_applications_horizon";
  DROP TYPE "public"."enum_applications_risk";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_applications_income_range" AS ENUM('under_5l', '5l_10l', '10l_25l', '25l_50l', '50l_1cr', 'above_1cr');
  CREATE TYPE "public"."enum_applications_goal" AS ENUM('wealth', 'retirement', 'child', 'home', 'income', 'other');
  CREATE TYPE "public"."enum_applications_horizon" AS ENUM('lt_3y', '3_5y', '5_10y', 'gt_10y');
  CREATE TYPE "public"."enum_applications_risk" AS ENUM('conservative', 'moderate', 'aggressive');
  DROP TABLE "applications_risk_answers" CASCADE;
  DROP TABLE "risk_profile_questions_answers" CASCADE;
  DROP TABLE "risk_profile_questions" CASCADE;
  DROP TABLE "risk_profile_bands" CASCADE;
  DROP TABLE "risk_profile" CASCADE;
  DROP TABLE "_risk_profile_v_version_questions_answers" CASCADE;
  DROP TABLE "_risk_profile_v_version_questions" CASCADE;
  DROP TABLE "_risk_profile_v_version_bands" CASCADE;
  DROP TABLE "_risk_profile_v" CASCADE;
  ALTER TABLE "applications" ADD COLUMN "income_range" "enum_applications_income_range";
  ALTER TABLE "applications" ADD COLUMN "goal" "enum_applications_goal";
  ALTER TABLE "applications" ADD COLUMN "horizon" "enum_applications_horizon";
  ALTER TABLE "applications" ADD COLUMN "risk" "enum_applications_risk";
  ALTER TABLE "onboarding" ADD COLUMN "verify_profile_title" varchar;
  ALTER TABLE "onboarding" ADD COLUMN "verify_profile_description" varchar;
  ALTER TABLE "onboarding" ADD COLUMN "verify_profile_note" varchar;
  ALTER TABLE "_onboarding_v" ADD COLUMN "version_verify_profile_title" varchar;
  ALTER TABLE "_onboarding_v" ADD COLUMN "version_verify_profile_description" varchar;
  ALTER TABLE "_onboarding_v" ADD COLUMN "version_verify_profile_note" varchar;
  ALTER TABLE "applications" DROP COLUMN "risk_category";
  ALTER TABLE "applications" DROP COLUMN "risk_score";
  ALTER TABLE "applications" DROP COLUMN "equity_limit";
  ALTER TABLE "applications" DROP COLUMN "questionnaire_version";
  ALTER TABLE "onboarding" DROP COLUMN "verify_layout";
  ALTER TABLE "_onboarding_v" DROP COLUMN "version_verify_layout";
  DROP TYPE "public"."enum_onboarding_verify_layout";
  DROP TYPE "public"."enum__onboarding_v_version_verify_layout";
  DROP TYPE "public"."enum_risk_profile_status";
  DROP TYPE "public"."enum__risk_profile_v_version_status";`)
}
