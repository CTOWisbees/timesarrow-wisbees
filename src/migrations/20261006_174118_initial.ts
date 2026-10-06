import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_model_portfolios_risk_level" AS ENUM('conservative', 'moderate', 'aggressive');
  CREATE TYPE "public"."enum_model_portfolios_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__model_portfolios_v_version_risk_level" AS ENUM('conservative', 'moderate', 'aggressive');
  CREATE TYPE "public"."enum__model_portfolios_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__faqs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_gallery_items_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__gallery_items_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_bookings_status" AS ENUM('new', 'contacted', 'closed');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'compliance', 'editor');
  CREATE TYPE "public"."enum_home_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_site_settings_social_links_platform" AS ENUM('linkedin', 'instagram', 'x', 'youtube');
  CREATE TYPE "public"."enum_site_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_settings_v_version_social_links_platform" AS ENUM('linkedin', 'instagram', 'x', 'youtube');
  CREATE TYPE "public"."enum__site_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_sebi_disclosure_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sebi_disclosure_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "model_portfolios_holdings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"logo_id" integer
  );
  
  CREATE TABLE "model_portfolios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"risk_level" "enum_model_portfolios_risk_level",
  	"order" numeric DEFAULT 0,
  	"description" varchar,
  	"expected_return" varchar,
  	"minimum_entry" varchar,
  	"show_expected_return" boolean DEFAULT true,
  	"badge" varchar,
  	"show_badge" boolean DEFAULT false,
  	"show_holdings" boolean DEFAULT true,
  	"details_href" varchar DEFAULT '#book-call',
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_model_portfolios_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_model_portfolios_v_version_holdings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_model_portfolios_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_risk_level" "enum__model_portfolios_v_version_risk_level",
  	"version_order" numeric DEFAULT 0,
  	"version_description" varchar,
  	"version_expected_return" varchar,
  	"version_minimum_entry" varchar,
  	"version_show_expected_return" boolean DEFAULT true,
  	"version_badge" varchar,
  	"version_show_badge" boolean DEFAULT false,
  	"version_show_holdings" boolean DEFAULT true,
  	"version_details_href" varchar DEFAULT '#book-call',
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__model_portfolios_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb,
  	"order" numeric DEFAULT 0,
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_faqs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_faqs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_question" varchar,
  	"version_answer" jsonb,
  	"version_order" numeric DEFAULT 0,
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__faqs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "gallery_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"date" timestamp(3) with time zone,
  	"href" varchar,
  	"order" numeric DEFAULT 0,
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_gallery_items_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_gallery_items_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_image_id" integer,
  	"version_date" timestamp(3) with time zone,
  	"version_href" varchar,
  	"version_order" numeric DEFAULT 0,
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__gallery_items_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_wide_url" varchar,
  	"sizes_wide_width" numeric,
  	"sizes_wide_height" numeric,
  	"sizes_wide_mime_type" varchar,
  	"sizes_wide_filesize" numeric,
  	"sizes_wide_filename" varchar
  );
  
  CREATE TABLE "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"mobile" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"preferred_slot" varchar,
  	"status" "enum_bookings_status" DEFAULT 'new',
  	"internal_notes" varchar,
  	"consent_text" varchar NOT NULL,
  	"consent_at" timestamp(3) with time zone NOT NULL,
  	"source" varchar,
  	"ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"model_portfolios_id" integer,
  	"faqs_id" integer,
  	"gallery_items_id" integer,
  	"media_id" integer,
  	"bookings_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "home_page_highlights_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "home_page_calculator_slider_marks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" numeric
  );
  
  CREATE TABLE "home_page_calculator_risk_bands" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"annual_return" numeric,
  	"is_default" boolean
  );
  
  CREATE TABLE "home_page_calculator_horizons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"years" numeric
  );
  
  CREATE TABLE "home_page_book_call_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "home_page_book_call_time_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_enabled" boolean DEFAULT true,
  	"hero_headline" varchar,
  	"hero_subheadline" varchar,
  	"hero_image_id" integer,
  	"hero_secondary_cta_label" varchar,
  	"hero_secondary_cta_href" varchar,
  	"hero_primary_cta_label" varchar,
  	"hero_primary_cta_href" varchar,
  	"hero_disclaimer" varchar,
  	"highlights_enabled" boolean DEFAULT true,
  	"highlights_title" varchar,
  	"highlights_subtitle" varchar,
  	"highlights_cta_label" varchar,
  	"highlights_cta_href" varchar,
  	"calculator_enabled" boolean DEFAULT true,
  	"calculator_title" varchar,
  	"calculator_min_amount" numeric DEFAULT 500,
  	"calculator_max_amount" numeric DEFAULT 100000,
  	"calculator_step" numeric DEFAULT 500,
  	"calculator_default_amount" numeric DEFAULT 20000,
  	"calculator_step_up_percent" numeric DEFAULT 10,
  	"calculator_show_return_assumptions" boolean DEFAULT true,
  	"calculator_default_horizon" numeric DEFAULT 20,
  	"calculator_disclaimer" varchar,
  	"illustration_enabled" boolean DEFAULT true,
  	"illustration_image_id" integer,
  	"portfolios_enabled" boolean DEFAULT true,
  	"portfolios_title" varchar,
  	"portfolios_intro" varchar,
  	"portfolios_disclaimer" varchar,
  	"gallery_enabled" boolean DEFAULT true,
  	"gallery_title" varchar,
  	"gallery_background_image_id" integer,
  	"gallery_cta_label" varchar,
  	"gallery_cta_href" varchar,
  	"faq_enabled" boolean DEFAULT true,
  	"faq_eyebrow" varchar,
  	"faq_title" varchar,
  	"book_call_enabled" boolean DEFAULT true,
  	"book_call_eyebrow" varchar,
  	"book_call_title" varchar,
  	"book_call_description" varchar,
  	"book_call_show_slot_picker" boolean DEFAULT true,
  	"book_call_consent_text" varchar,
  	"book_call_submit_label" varchar DEFAULT 'Submit to book a call',
  	"book_call_success_title" varchar DEFAULT 'Your call is booked',
  	"book_call_success_message" varchar,
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"_status" "enum_home_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_home_page_v_version_highlights_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_calculator_slider_marks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_calculator_risk_bands" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"annual_return" numeric,
  	"is_default" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_calculator_horizons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"years" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_book_call_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_book_call_time_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_enabled" boolean DEFAULT true,
  	"version_hero_headline" varchar,
  	"version_hero_subheadline" varchar,
  	"version_hero_image_id" integer,
  	"version_hero_secondary_cta_label" varchar,
  	"version_hero_secondary_cta_href" varchar,
  	"version_hero_primary_cta_label" varchar,
  	"version_hero_primary_cta_href" varchar,
  	"version_hero_disclaimer" varchar,
  	"version_highlights_enabled" boolean DEFAULT true,
  	"version_highlights_title" varchar,
  	"version_highlights_subtitle" varchar,
  	"version_highlights_cta_label" varchar,
  	"version_highlights_cta_href" varchar,
  	"version_calculator_enabled" boolean DEFAULT true,
  	"version_calculator_title" varchar,
  	"version_calculator_min_amount" numeric DEFAULT 500,
  	"version_calculator_max_amount" numeric DEFAULT 100000,
  	"version_calculator_step" numeric DEFAULT 500,
  	"version_calculator_default_amount" numeric DEFAULT 20000,
  	"version_calculator_step_up_percent" numeric DEFAULT 10,
  	"version_calculator_show_return_assumptions" boolean DEFAULT true,
  	"version_calculator_default_horizon" numeric DEFAULT 20,
  	"version_calculator_disclaimer" varchar,
  	"version_illustration_enabled" boolean DEFAULT true,
  	"version_illustration_image_id" integer,
  	"version_portfolios_enabled" boolean DEFAULT true,
  	"version_portfolios_title" varchar,
  	"version_portfolios_intro" varchar,
  	"version_portfolios_disclaimer" varchar,
  	"version_gallery_enabled" boolean DEFAULT true,
  	"version_gallery_title" varchar,
  	"version_gallery_background_image_id" integer,
  	"version_gallery_cta_label" varchar,
  	"version_gallery_cta_href" varchar,
  	"version_faq_enabled" boolean DEFAULT true,
  	"version_faq_eyebrow" varchar,
  	"version_faq_title" varchar,
  	"version_book_call_enabled" boolean DEFAULT true,
  	"version_book_call_eyebrow" varchar,
  	"version_book_call_title" varchar,
  	"version_book_call_description" varchar,
  	"version_book_call_show_slot_picker" boolean DEFAULT true,
  	"version_book_call_consent_text" varchar,
  	"version_book_call_submit_label" varchar DEFAULT 'Submit to book a call',
  	"version_book_call_success_title" varchar DEFAULT 'Your call is booked',
  	"version_book_call_success_message" varchar,
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version__status" "enum__home_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "site_settings_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "site_settings_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "site_settings_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar
  );
  
  CREATE TABLE "site_settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_social_links_platform",
  	"href" varchar
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'WisBees',
  	"logo_id" integer,
  	"meta_description" varchar,
  	"login_cta_label" varchar,
  	"login_cta_href" varchar,
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"_status" "enum_site_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_site_settings_v_version_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum__site_settings_v_version_social_links_platform",
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_site_name" varchar DEFAULT 'WisBees',
  	"version_logo_id" integer,
  	"version_meta_description" varchar,
  	"version_login_cta_label" varchar,
  	"version_login_cta_href" varchar,
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version__status" "enum__site_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "sebi_disclosure_disclaimers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "sebi_disclosure_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "sebi_disclosure" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"firm_name" varchar,
  	"registered_address" varchar,
  	"phone" varchar,
  	"registration_type" varchar,
  	"sebi_registration_number" varchar,
  	"validity" varchar DEFAULT 'Valid till cancelled by SEBI',
  	"basl_id" varchar,
  	"sebi_regional_office" varchar,
  	"principal_officer_name" varchar,
  	"principal_officer_phone" varchar,
  	"principal_officer_email" varchar,
  	"compliance_officer_name" varchar,
  	"compliance_officer_phone" varchar,
  	"compliance_officer_email" varchar,
  	"page_body" jsonb,
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"_status" "enum_sebi_disclosure_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_disclaimers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v_version_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sebi_disclosure_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_firm_name" varchar,
  	"version_registered_address" varchar,
  	"version_phone" varchar,
  	"version_registration_type" varchar,
  	"version_sebi_registration_number" varchar,
  	"version_validity" varchar DEFAULT 'Valid till cancelled by SEBI',
  	"version_basl_id" varchar,
  	"version_sebi_regional_office" varchar,
  	"version_principal_officer_name" varchar,
  	"version_principal_officer_phone" varchar,
  	"version_principal_officer_email" varchar,
  	"version_compliance_officer_name" varchar,
  	"version_compliance_officer_phone" varchar,
  	"version_compliance_officer_email" varchar,
  	"version_page_body" jsonb,
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version__status" "enum__sebi_disclosure_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "model_portfolios_holdings" ADD CONSTRAINT "model_portfolios_holdings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "model_portfolios_holdings" ADD CONSTRAINT "model_portfolios_holdings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."model_portfolios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_model_portfolios_v_version_holdings" ADD CONSTRAINT "_model_portfolios_v_version_holdings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_model_portfolios_v_version_holdings" ADD CONSTRAINT "_model_portfolios_v_version_holdings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_model_portfolios_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_model_portfolios_v" ADD CONSTRAINT "_model_portfolios_v_parent_id_model_portfolios_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."model_portfolios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_faqs_v" ADD CONSTRAINT "_faqs_v_parent_id_faqs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."faqs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_items_v" ADD CONSTRAINT "_gallery_items_v_parent_id_gallery_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gallery_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_items_v" ADD CONSTRAINT "_gallery_items_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_model_portfolios_fk" FOREIGN KEY ("model_portfolios_id") REFERENCES "public"."model_portfolios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_items_fk" FOREIGN KEY ("gallery_items_id") REFERENCES "public"."gallery_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_highlights_items" ADD CONSTRAINT "home_page_highlights_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_calculator_slider_marks" ADD CONSTRAINT "home_page_calculator_slider_marks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_calculator_risk_bands" ADD CONSTRAINT "home_page_calculator_risk_bands_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_calculator_horizons" ADD CONSTRAINT "home_page_calculator_horizons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_book_call_benefits" ADD CONSTRAINT "home_page_book_call_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_book_call_time_slots" ADD CONSTRAINT "home_page_book_call_time_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_illustration_image_id_media_id_fk" FOREIGN KEY ("illustration_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_gallery_background_image_id_media_id_fk" FOREIGN KEY ("gallery_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_highlights_items" ADD CONSTRAINT "_home_page_v_version_highlights_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_calculator_slider_marks" ADD CONSTRAINT "_home_page_v_version_calculator_slider_marks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_calculator_risk_bands" ADD CONSTRAINT "_home_page_v_version_calculator_risk_bands_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_calculator_horizons" ADD CONSTRAINT "_home_page_v_version_calculator_horizons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_book_call_benefits" ADD CONSTRAINT "_home_page_v_version_book_call_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_book_call_time_slots" ADD CONSTRAINT "_home_page_v_version_book_call_time_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_illustration_image_id_media_id_fk" FOREIGN KEY ("version_illustration_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_gallery_background_image_id_media_id_fk" FOREIGN KEY ("version_gallery_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_nav_items" ADD CONSTRAINT "site_settings_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns_links" ADD CONSTRAINT "site_settings_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns" ADD CONSTRAINT "site_settings_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_nav_items" ADD CONSTRAINT "_site_settings_v_version_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_footer_columns_links" ADD CONSTRAINT "_site_settings_v_version_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_footer_columns" ADD CONSTRAINT "_site_settings_v_version_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_social_links" ADD CONSTRAINT "_site_settings_v_version_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sebi_disclosure_disclaimers" ADD CONSTRAINT "sebi_disclosure_disclaimers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sebi_disclosure_legal_links" ADD CONSTRAINT "sebi_disclosure_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sebi_disclosure"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_disclaimers" ADD CONSTRAINT "_sebi_disclosure_v_version_disclaimers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sebi_disclosure_v_version_legal_links" ADD CONSTRAINT "_sebi_disclosure_v_version_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sebi_disclosure_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "model_portfolios_holdings_order_idx" ON "model_portfolios_holdings" USING btree ("_order");
  CREATE INDEX "model_portfolios_holdings_parent_id_idx" ON "model_portfolios_holdings" USING btree ("_parent_id");
  CREATE INDEX "model_portfolios_holdings_logo_idx" ON "model_portfolios_holdings" USING btree ("logo_id");
  CREATE INDEX "model_portfolios_updated_at_idx" ON "model_portfolios" USING btree ("updated_at");
  CREATE INDEX "model_portfolios_created_at_idx" ON "model_portfolios" USING btree ("created_at");
  CREATE INDEX "model_portfolios__status_idx" ON "model_portfolios" USING btree ("_status");
  CREATE INDEX "_model_portfolios_v_version_holdings_order_idx" ON "_model_portfolios_v_version_holdings" USING btree ("_order");
  CREATE INDEX "_model_portfolios_v_version_holdings_parent_id_idx" ON "_model_portfolios_v_version_holdings" USING btree ("_parent_id");
  CREATE INDEX "_model_portfolios_v_version_holdings_logo_idx" ON "_model_portfolios_v_version_holdings" USING btree ("logo_id");
  CREATE INDEX "_model_portfolios_v_parent_idx" ON "_model_portfolios_v" USING btree ("parent_id");
  CREATE INDEX "_model_portfolios_v_version_version_updated_at_idx" ON "_model_portfolios_v" USING btree ("version_updated_at");
  CREATE INDEX "_model_portfolios_v_version_version_created_at_idx" ON "_model_portfolios_v" USING btree ("version_created_at");
  CREATE INDEX "_model_portfolios_v_version_version__status_idx" ON "_model_portfolios_v" USING btree ("version__status");
  CREATE INDEX "_model_portfolios_v_created_at_idx" ON "_model_portfolios_v" USING btree ("created_at");
  CREATE INDEX "_model_portfolios_v_updated_at_idx" ON "_model_portfolios_v" USING btree ("updated_at");
  CREATE INDEX "_model_portfolios_v_latest_idx" ON "_model_portfolios_v" USING btree ("latest");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "faqs__status_idx" ON "faqs" USING btree ("_status");
  CREATE INDEX "_faqs_v_parent_idx" ON "_faqs_v" USING btree ("parent_id");
  CREATE INDEX "_faqs_v_version_version_updated_at_idx" ON "_faqs_v" USING btree ("version_updated_at");
  CREATE INDEX "_faqs_v_version_version_created_at_idx" ON "_faqs_v" USING btree ("version_created_at");
  CREATE INDEX "_faqs_v_version_version__status_idx" ON "_faqs_v" USING btree ("version__status");
  CREATE INDEX "_faqs_v_created_at_idx" ON "_faqs_v" USING btree ("created_at");
  CREATE INDEX "_faqs_v_updated_at_idx" ON "_faqs_v" USING btree ("updated_at");
  CREATE INDEX "_faqs_v_latest_idx" ON "_faqs_v" USING btree ("latest");
  CREATE INDEX "gallery_items_image_idx" ON "gallery_items" USING btree ("image_id");
  CREATE INDEX "gallery_items_updated_at_idx" ON "gallery_items" USING btree ("updated_at");
  CREATE INDEX "gallery_items_created_at_idx" ON "gallery_items" USING btree ("created_at");
  CREATE INDEX "gallery_items__status_idx" ON "gallery_items" USING btree ("_status");
  CREATE INDEX "_gallery_items_v_parent_idx" ON "_gallery_items_v" USING btree ("parent_id");
  CREATE INDEX "_gallery_items_v_version_version_image_idx" ON "_gallery_items_v" USING btree ("version_image_id");
  CREATE INDEX "_gallery_items_v_version_version_updated_at_idx" ON "_gallery_items_v" USING btree ("version_updated_at");
  CREATE INDEX "_gallery_items_v_version_version_created_at_idx" ON "_gallery_items_v" USING btree ("version_created_at");
  CREATE INDEX "_gallery_items_v_version_version__status_idx" ON "_gallery_items_v" USING btree ("version__status");
  CREATE INDEX "_gallery_items_v_created_at_idx" ON "_gallery_items_v" USING btree ("created_at");
  CREATE INDEX "_gallery_items_v_updated_at_idx" ON "_gallery_items_v" USING btree ("updated_at");
  CREATE INDEX "_gallery_items_v_latest_idx" ON "_gallery_items_v" USING btree ("latest");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_wide_sizes_wide_filename_idx" ON "media" USING btree ("sizes_wide_filename");
  CREATE INDEX "bookings_ip_hash_idx" ON "bookings" USING btree ("ip_hash");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_model_portfolios_id_idx" ON "payload_locked_documents_rels" USING btree ("model_portfolios_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_gallery_items_id_idx" ON "payload_locked_documents_rels" USING btree ("gallery_items_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "home_page_highlights_items_order_idx" ON "home_page_highlights_items" USING btree ("_order");
  CREATE INDEX "home_page_highlights_items_parent_id_idx" ON "home_page_highlights_items" USING btree ("_parent_id");
  CREATE INDEX "home_page_calculator_slider_marks_order_idx" ON "home_page_calculator_slider_marks" USING btree ("_order");
  CREATE INDEX "home_page_calculator_slider_marks_parent_id_idx" ON "home_page_calculator_slider_marks" USING btree ("_parent_id");
  CREATE INDEX "home_page_calculator_risk_bands_order_idx" ON "home_page_calculator_risk_bands" USING btree ("_order");
  CREATE INDEX "home_page_calculator_risk_bands_parent_id_idx" ON "home_page_calculator_risk_bands" USING btree ("_parent_id");
  CREATE INDEX "home_page_calculator_horizons_order_idx" ON "home_page_calculator_horizons" USING btree ("_order");
  CREATE INDEX "home_page_calculator_horizons_parent_id_idx" ON "home_page_calculator_horizons" USING btree ("_parent_id");
  CREATE INDEX "home_page_book_call_benefits_order_idx" ON "home_page_book_call_benefits" USING btree ("_order");
  CREATE INDEX "home_page_book_call_benefits_parent_id_idx" ON "home_page_book_call_benefits" USING btree ("_parent_id");
  CREATE INDEX "home_page_book_call_time_slots_order_idx" ON "home_page_book_call_time_slots" USING btree ("_order");
  CREATE INDEX "home_page_book_call_time_slots_parent_id_idx" ON "home_page_book_call_time_slots" USING btree ("_parent_id");
  CREATE INDEX "home_page_hero_hero_image_idx" ON "home_page" USING btree ("hero_image_id");
  CREATE INDEX "home_page_illustration_illustration_image_idx" ON "home_page" USING btree ("illustration_image_id");
  CREATE INDEX "home_page_gallery_gallery_background_image_idx" ON "home_page" USING btree ("gallery_background_image_id");
  CREATE INDEX "home_page__status_idx" ON "home_page" USING btree ("_status");
  CREATE INDEX "_home_page_v_version_highlights_items_order_idx" ON "_home_page_v_version_highlights_items" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_highlights_items_parent_id_idx" ON "_home_page_v_version_highlights_items" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_calculator_slider_marks_order_idx" ON "_home_page_v_version_calculator_slider_marks" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_calculator_slider_marks_parent_id_idx" ON "_home_page_v_version_calculator_slider_marks" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_calculator_risk_bands_order_idx" ON "_home_page_v_version_calculator_risk_bands" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_calculator_risk_bands_parent_id_idx" ON "_home_page_v_version_calculator_risk_bands" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_calculator_horizons_order_idx" ON "_home_page_v_version_calculator_horizons" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_calculator_horizons_parent_id_idx" ON "_home_page_v_version_calculator_horizons" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_book_call_benefits_order_idx" ON "_home_page_v_version_book_call_benefits" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_book_call_benefits_parent_id_idx" ON "_home_page_v_version_book_call_benefits" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_book_call_time_slots_order_idx" ON "_home_page_v_version_book_call_time_slots" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_book_call_time_slots_parent_id_idx" ON "_home_page_v_version_book_call_time_slots" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_hero_version_hero_image_idx" ON "_home_page_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_home_page_v_version_illustration_version_illustration_i_idx" ON "_home_page_v" USING btree ("version_illustration_image_id");
  CREATE INDEX "_home_page_v_version_gallery_version_gallery_background__idx" ON "_home_page_v" USING btree ("version_gallery_background_image_id");
  CREATE INDEX "_home_page_v_version_version__status_idx" ON "_home_page_v" USING btree ("version__status");
  CREATE INDEX "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE INDEX "_home_page_v_latest_idx" ON "_home_page_v" USING btree ("latest");
  CREATE INDEX "site_settings_nav_items_order_idx" ON "site_settings_nav_items" USING btree ("_order");
  CREATE INDEX "site_settings_nav_items_parent_id_idx" ON "site_settings_nav_items" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_links_order_idx" ON "site_settings_footer_columns_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_links_parent_id_idx" ON "site_settings_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_order_idx" ON "site_settings_footer_columns" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_parent_id_idx" ON "site_settings_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings__status_idx" ON "site_settings" USING btree ("_status");
  CREATE INDEX "_site_settings_v_version_nav_items_order_idx" ON "_site_settings_v_version_nav_items" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_nav_items_parent_id_idx" ON "_site_settings_v_version_nav_items" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_footer_columns_links_order_idx" ON "_site_settings_v_version_footer_columns_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_footer_columns_links_parent_id_idx" ON "_site_settings_v_version_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_footer_columns_order_idx" ON "_site_settings_v_version_footer_columns" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_footer_columns_parent_id_idx" ON "_site_settings_v_version_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_social_links_order_idx" ON "_site_settings_v_version_social_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_social_links_parent_id_idx" ON "_site_settings_v_version_social_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_version_logo_idx" ON "_site_settings_v" USING btree ("version_logo_id");
  CREATE INDEX "_site_settings_v_version_version__status_idx" ON "_site_settings_v" USING btree ("version__status");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_latest_idx" ON "_site_settings_v" USING btree ("latest");
  CREATE INDEX "sebi_disclosure_disclaimers_order_idx" ON "sebi_disclosure_disclaimers" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_disclaimers_parent_id_idx" ON "sebi_disclosure_disclaimers" USING btree ("_parent_id");
  CREATE INDEX "sebi_disclosure_legal_links_order_idx" ON "sebi_disclosure_legal_links" USING btree ("_order");
  CREATE INDEX "sebi_disclosure_legal_links_parent_id_idx" ON "sebi_disclosure_legal_links" USING btree ("_parent_id");
  CREATE INDEX "sebi_disclosure__status_idx" ON "sebi_disclosure" USING btree ("_status");
  CREATE INDEX "_sebi_disclosure_v_version_disclaimers_order_idx" ON "_sebi_disclosure_v_version_disclaimers" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_disclaimers_parent_id_idx" ON "_sebi_disclosure_v_version_disclaimers" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_legal_links_order_idx" ON "_sebi_disclosure_v_version_legal_links" USING btree ("_order");
  CREATE INDEX "_sebi_disclosure_v_version_legal_links_parent_id_idx" ON "_sebi_disclosure_v_version_legal_links" USING btree ("_parent_id");
  CREATE INDEX "_sebi_disclosure_v_version_version__status_idx" ON "_sebi_disclosure_v" USING btree ("version__status");
  CREATE INDEX "_sebi_disclosure_v_created_at_idx" ON "_sebi_disclosure_v" USING btree ("created_at");
  CREATE INDEX "_sebi_disclosure_v_updated_at_idx" ON "_sebi_disclosure_v" USING btree ("updated_at");
  CREATE INDEX "_sebi_disclosure_v_latest_idx" ON "_sebi_disclosure_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "model_portfolios_holdings" CASCADE;
  DROP TABLE "model_portfolios" CASCADE;
  DROP TABLE "_model_portfolios_v_version_holdings" CASCADE;
  DROP TABLE "_model_portfolios_v" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "_faqs_v" CASCADE;
  DROP TABLE "gallery_items" CASCADE;
  DROP TABLE "_gallery_items_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "bookings" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "home_page_highlights_items" CASCADE;
  DROP TABLE "home_page_calculator_slider_marks" CASCADE;
  DROP TABLE "home_page_calculator_risk_bands" CASCADE;
  DROP TABLE "home_page_calculator_horizons" CASCADE;
  DROP TABLE "home_page_book_call_benefits" CASCADE;
  DROP TABLE "home_page_book_call_time_slots" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "_home_page_v_version_highlights_items" CASCADE;
  DROP TABLE "_home_page_v_version_calculator_slider_marks" CASCADE;
  DROP TABLE "_home_page_v_version_calculator_risk_bands" CASCADE;
  DROP TABLE "_home_page_v_version_calculator_horizons" CASCADE;
  DROP TABLE "_home_page_v_version_book_call_benefits" CASCADE;
  DROP TABLE "_home_page_v_version_book_call_time_slots" CASCADE;
  DROP TABLE "_home_page_v" CASCADE;
  DROP TABLE "site_settings_nav_items" CASCADE;
  DROP TABLE "site_settings_footer_columns_links" CASCADE;
  DROP TABLE "site_settings_footer_columns" CASCADE;
  DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "_site_settings_v_version_nav_items" CASCADE;
  DROP TABLE "_site_settings_v_version_footer_columns_links" CASCADE;
  DROP TABLE "_site_settings_v_version_footer_columns" CASCADE;
  DROP TABLE "_site_settings_v_version_social_links" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "sebi_disclosure_disclaimers" CASCADE;
  DROP TABLE "sebi_disclosure_legal_links" CASCADE;
  DROP TABLE "sebi_disclosure" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_disclaimers" CASCADE;
  DROP TABLE "_sebi_disclosure_v_version_legal_links" CASCADE;
  DROP TABLE "_sebi_disclosure_v" CASCADE;
  DROP TYPE "public"."enum_model_portfolios_risk_level";
  DROP TYPE "public"."enum_model_portfolios_status";
  DROP TYPE "public"."enum__model_portfolios_v_version_risk_level";
  DROP TYPE "public"."enum__model_portfolios_v_version_status";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum__faqs_v_version_status";
  DROP TYPE "public"."enum_gallery_items_status";
  DROP TYPE "public"."enum__gallery_items_v_version_status";
  DROP TYPE "public"."enum_bookings_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_home_page_status";
  DROP TYPE "public"."enum__home_page_v_version_status";
  DROP TYPE "public"."enum_site_settings_social_links_platform";
  DROP TYPE "public"."enum_site_settings_status";
  DROP TYPE "public"."enum__site_settings_v_version_social_links_platform";
  DROP TYPE "public"."enum__site_settings_v_version_status";
  DROP TYPE "public"."enum_sebi_disclosure_status";
  DROP TYPE "public"."enum__sebi_disclosure_v_version_status";`)
}
