import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_portfolio_scan_sub_scores_sub_score" AS ENUM('diversification', 'concentration', 'risk', 'assetMix', 'cost');
  CREATE TYPE "public"."enum_portfolio_scan_flags_rule" AS ENUM('R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08', 'R09', 'R10', 'R11', 'R12', 'R13', 'R14');
  CREATE TYPE "public"."enum_portfolio_scan_errors_code" AS ENUM('unreadable', 'too_large', 'wrong_type', 'password', 'too_many', 'nothing_found', 'rate_limited', 'generic', 'no_holdings');
  CREATE TYPE "public"."enum_portfolio_scan_plans_plan_id" AS ENUM('insights', 'pro');
  CREATE TYPE "public"."enum_portfolio_scan_locked_cards_card" AS ENUM('overlap', 'drag', 'drawdown', 'returns', 'stress', 'ratios', 'rebalance', 'tax', 'whatif', 'pdf');
  CREATE TYPE "public"."enum_portfolio_scan_locked_cards_plan" AS ENUM('insights', 'pro');
  CREATE TYPE "public"."enum_portfolio_scan_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__portfolio_scan_v_version_sub_scores_sub_score" AS ENUM('diversification', 'concentration', 'risk', 'assetMix', 'cost');
  CREATE TYPE "public"."enum__portfolio_scan_v_version_flags_rule" AS ENUM('R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08', 'R09', 'R10', 'R11', 'R12', 'R13', 'R14');
  CREATE TYPE "public"."enum__portfolio_scan_v_version_errors_code" AS ENUM('unreadable', 'too_large', 'wrong_type', 'password', 'too_many', 'nothing_found', 'rate_limited', 'generic', 'no_holdings');
  CREATE TYPE "public"."enum__portfolio_scan_v_version_plans_plan_id" AS ENUM('insights', 'pro');
  CREATE TYPE "public"."enum__portfolio_scan_v_version_locked_cards_card" AS ENUM('overlap', 'drag', 'drawdown', 'returns', 'stress', 'ratios', 'rebalance', 'tax', 'whatif', 'pdf');
  CREATE TYPE "public"."enum__portfolio_scan_v_version_locked_cards_plan" AS ENUM('insights', 'pro');
  CREATE TYPE "public"."enum__portfolio_scan_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_scan_config_severities_r01" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r02" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r03" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r04" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r05" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r06" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r07" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r08" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r09" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r10" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r11" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r12" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r13" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_severities_r14" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum_scan_config_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r01" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r02" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r03" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r04" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r05" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r06" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r07" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r08" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r09" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r10" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r11" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r12" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r13" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_severities_r14" AS ENUM('critical', 'high', 'medium', 'low', 'info');
  CREATE TYPE "public"."enum__scan_config_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "portfolio_scan_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"steps" varchar
  );
  
  CREATE TABLE "portfolio_scan_progress" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "portfolio_scan_sub_scores" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sub_score" "enum_portfolio_scan_sub_scores_sub_score",
  	"label" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "portfolio_scan_save_prompt_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "portfolio_scan_flags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rule" "enum_portfolio_scan_flags_rule",
  	"title" varchar,
  	"why" varchar,
  	"explainer_url" varchar
  );
  
  CREATE TABLE "portfolio_scan_errors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" "enum_portfolio_scan_errors_code",
  	"message" varchar
  );
  
  CREATE TABLE "portfolio_scan_plans_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "portfolio_scan_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"plan_id" "enum_portfolio_scan_plans_plan_id",
  	"name" varchar,
  	"price_paise" numeric,
  	"period" varchar,
  	"cta" varchar
  );
  
  CREATE TABLE "portfolio_scan_locked_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"card" "enum_portfolio_scan_locked_cards_card",
  	"plan" "enum_portfolio_scan_locked_cards_plan",
  	"title" varchar,
  	"teaser" varchar
  );
  
  CREATE TABLE "portfolio_scan" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"intro" varchar,
  	"trust_line" varchar,
  	"upload_tab" varchar,
  	"manual_tab" varchar,
  	"sample_link" varchar,
  	"show_sample" boolean DEFAULT true,
  	"steps_choose" varchar,
  	"steps_review" varchar,
  	"steps_details" varchar,
  	"steps_results" varchar,
  	"consent_notice" varchar,
  	"drop_title" varchar,
  	"drop_hint" varchar,
  	"accepted_sources" varchar,
  	"where_title" varchar,
  	"template_label" varchar,
  	"password_label" varchar,
  	"password_note" varchar,
  	"aa_note" varchar,
  	"mapping_title" varchar,
  	"mapping_intro" varchar,
  	"search_label" varchar,
  	"search_placeholder" varchar,
  	"quantity_label" varchar,
  	"invested_label" varchar,
  	"value_label" varchar,
  	"value_help" varchar,
  	"add_cash" varchar,
  	"paste_label" varchar,
  	"import_csv" varchar,
  	"paste_help" varchar,
  	"empty_state" varchar,
  	"review_title" varchar,
  	"review_intro" varchar,
  	"purchase_column" varchar,
  	"unresolved_label" varchar,
  	"duplicate_notice" varchar,
  	"review_confirm" varchar,
  	"details_title" varchar,
  	"holding_period_label" varchar,
  	"holding_period_why" varchar,
  	"horizon_label" varchar,
  	"horizon_why" varchar,
  	"benchmark_label" varchar,
  	"benchmark_why" varchar,
  	"submit_label" varchar,
  	"bands_healthy_label" varchar,
  	"bands_healthy_summary" varchar,
  	"bands_fair_label" varchar,
  	"bands_fair_summary" varchar,
  	"bands_attention_label" varchar,
  	"bands_attention_summary" varchar,
  	"bands_at_risk_label" varchar,
  	"bands_at_risk_summary" varchar,
  	"status_words_good" varchar,
  	"status_words_ok" varchar,
  	"status_words_weak" varchar,
  	"status_words_na" varchar,
  	"flags_title" varchar,
  	"more_flags" varchar,
  	"no_flags" varchar,
  	"save_prompt_title" varchar,
  	"save_prompt_body" varchar,
  	"save_prompt_cta" varchar,
  	"save_prompt_saved" varchar,
  	"blocks_allocation" varchar,
  	"blocks_effective_mix" varchar,
  	"blocks_sectors" varchar,
  	"blocks_holdings" varchar,
  	"blocks_risk" varchar,
  	"blocks_benchmark" varchar,
  	"blocks_data_quality" varchar,
  	"risk_labels_low" varchar,
  	"risk_labels_moderate" varchar,
  	"risk_labels_high" varchar,
  	"risk_labels_very_high" varchar,
  	"risk_sentence" varchar,
  	"benchmark_ahead" varchar,
  	"benchmark_behind" varchar,
  	"benchmark_prompt" varchar,
  	"coverage_chip" varchar,
  	"as_of_chip" varchar,
  	"provisional" varchar,
  	"data_quality_line" varchar,
  	"disclaimer" varchar,
  	"dashboard_title" varchar,
  	"new_check_label" varchar,
  	"saved_banner" varchar,
  	"trend_title" varchar,
  	"trend_empty" varchar,
  	"alerts_title" varchar,
  	"alerts_empty" varchar,
  	"alert_templates_score_drop" varchar,
  	"alert_templates_new_flag" varchar,
  	"alert_templates_limit_crossed" varchar,
  	"alert_templates_recheck_due" varchar,
  	"reminder_label" varchar,
  	"reminder_help" varchar,
  	"alert_drop_label" varchar,
  	"concentration_label" varchar,
  	"data_title" varchar,
  	"download_label" varchar,
  	"delete_label" varchar,
  	"delete_confirm" varchar,
  	"plans_title" varchar,
  	"plans_intro" varchar,
  	"refund_line" varchar,
  	"locked_fallback" varchar,
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"_status" "enum_portfolio_scan_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_portfolio_scan_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"steps" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_portfolio_scan_v_version_progress" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_portfolio_scan_v_version_sub_scores" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"sub_score" "enum__portfolio_scan_v_version_sub_scores_sub_score",
  	"label" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_portfolio_scan_v_version_save_prompt_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_portfolio_scan_v_version_flags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rule" "enum__portfolio_scan_v_version_flags_rule",
  	"title" varchar,
  	"why" varchar,
  	"explainer_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_portfolio_scan_v_version_errors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" "enum__portfolio_scan_v_version_errors_code",
  	"message" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_portfolio_scan_v_version_plans_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_portfolio_scan_v_version_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"plan_id" "enum__portfolio_scan_v_version_plans_plan_id",
  	"name" varchar,
  	"price_paise" numeric,
  	"period" varchar,
  	"cta" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_portfolio_scan_v_version_locked_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"card" "enum__portfolio_scan_v_version_locked_cards_card",
  	"plan" "enum__portfolio_scan_v_version_locked_cards_plan",
  	"title" varchar,
  	"teaser" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_portfolio_scan_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar,
  	"version_intro" varchar,
  	"version_trust_line" varchar,
  	"version_upload_tab" varchar,
  	"version_manual_tab" varchar,
  	"version_sample_link" varchar,
  	"version_show_sample" boolean DEFAULT true,
  	"version_steps_choose" varchar,
  	"version_steps_review" varchar,
  	"version_steps_details" varchar,
  	"version_steps_results" varchar,
  	"version_consent_notice" varchar,
  	"version_drop_title" varchar,
  	"version_drop_hint" varchar,
  	"version_accepted_sources" varchar,
  	"version_where_title" varchar,
  	"version_template_label" varchar,
  	"version_password_label" varchar,
  	"version_password_note" varchar,
  	"version_aa_note" varchar,
  	"version_mapping_title" varchar,
  	"version_mapping_intro" varchar,
  	"version_search_label" varchar,
  	"version_search_placeholder" varchar,
  	"version_quantity_label" varchar,
  	"version_invested_label" varchar,
  	"version_value_label" varchar,
  	"version_value_help" varchar,
  	"version_add_cash" varchar,
  	"version_paste_label" varchar,
  	"version_import_csv" varchar,
  	"version_paste_help" varchar,
  	"version_empty_state" varchar,
  	"version_review_title" varchar,
  	"version_review_intro" varchar,
  	"version_purchase_column" varchar,
  	"version_unresolved_label" varchar,
  	"version_duplicate_notice" varchar,
  	"version_review_confirm" varchar,
  	"version_details_title" varchar,
  	"version_holding_period_label" varchar,
  	"version_holding_period_why" varchar,
  	"version_horizon_label" varchar,
  	"version_horizon_why" varchar,
  	"version_benchmark_label" varchar,
  	"version_benchmark_why" varchar,
  	"version_submit_label" varchar,
  	"version_bands_healthy_label" varchar,
  	"version_bands_healthy_summary" varchar,
  	"version_bands_fair_label" varchar,
  	"version_bands_fair_summary" varchar,
  	"version_bands_attention_label" varchar,
  	"version_bands_attention_summary" varchar,
  	"version_bands_at_risk_label" varchar,
  	"version_bands_at_risk_summary" varchar,
  	"version_status_words_good" varchar,
  	"version_status_words_ok" varchar,
  	"version_status_words_weak" varchar,
  	"version_status_words_na" varchar,
  	"version_flags_title" varchar,
  	"version_more_flags" varchar,
  	"version_no_flags" varchar,
  	"version_save_prompt_title" varchar,
  	"version_save_prompt_body" varchar,
  	"version_save_prompt_cta" varchar,
  	"version_save_prompt_saved" varchar,
  	"version_blocks_allocation" varchar,
  	"version_blocks_effective_mix" varchar,
  	"version_blocks_sectors" varchar,
  	"version_blocks_holdings" varchar,
  	"version_blocks_risk" varchar,
  	"version_blocks_benchmark" varchar,
  	"version_blocks_data_quality" varchar,
  	"version_risk_labels_low" varchar,
  	"version_risk_labels_moderate" varchar,
  	"version_risk_labels_high" varchar,
  	"version_risk_labels_very_high" varchar,
  	"version_risk_sentence" varchar,
  	"version_benchmark_ahead" varchar,
  	"version_benchmark_behind" varchar,
  	"version_benchmark_prompt" varchar,
  	"version_coverage_chip" varchar,
  	"version_as_of_chip" varchar,
  	"version_provisional" varchar,
  	"version_data_quality_line" varchar,
  	"version_disclaimer" varchar,
  	"version_dashboard_title" varchar,
  	"version_new_check_label" varchar,
  	"version_saved_banner" varchar,
  	"version_trend_title" varchar,
  	"version_trend_empty" varchar,
  	"version_alerts_title" varchar,
  	"version_alerts_empty" varchar,
  	"version_alert_templates_score_drop" varchar,
  	"version_alert_templates_new_flag" varchar,
  	"version_alert_templates_limit_crossed" varchar,
  	"version_alert_templates_recheck_due" varchar,
  	"version_reminder_label" varchar,
  	"version_reminder_help" varchar,
  	"version_alert_drop_label" varchar,
  	"version_concentration_label" varchar,
  	"version_data_title" varchar,
  	"version_download_label" varchar,
  	"version_delete_label" varchar,
  	"version_delete_confirm" varchar,
  	"version_plans_title" varchar,
  	"version_plans_intro" varchar,
  	"version_refund_line" varchar,
  	"version_locked_fallback" varchar,
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version__status" "enum__portfolio_scan_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "scan_config" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"weights_diversification" numeric DEFAULT 25,
  	"weights_concentration" numeric DEFAULT 20,
  	"weights_risk" numeric DEFAULT 20,
  	"weights_asset_mix" numeric DEFAULT 20,
  	"weights_cost" numeric DEFAULT 15,
  	"effective_holdings_bad" numeric DEFAULT 3,
  	"effective_holdings_good" numeric DEFAULT 15,
  	"effective_sectors_bad" numeric DEFAULT 2,
  	"effective_sectors_good" numeric DEFAULT 8,
  	"top1_bad" numeric DEFAULT 40,
  	"top1_good" numeric DEFAULT 10,
  	"top5_bad" numeric DEFAULT 80,
  	"top5_good" numeric DEFAULT 40,
  	"vol_ratio_bad" numeric DEFAULT 1.5,
  	"vol_ratio_good" numeric DEFAULT 0.8,
  	"ter_bad" numeric DEFAULT 2,
  	"ter_good" numeric DEFAULT 0.5,
  	"regular_share_bad" numeric DEFAULT 60,
  	"regular_share_good" numeric DEFAULT 0,
  	"bands_healthy" numeric DEFAULT 80,
  	"bands_fair" numeric DEFAULT 60,
  	"bands_attention" numeric DEFAULT 40,
  	"critical_cap" numeric DEFAULT 59,
  	"provisional_below" numeric DEFAULT 70,
  	"penalties_one_class_above90" numeric DEFAULT 30,
  	"penalties_one_class80to90" numeric DEFAULT 15,
  	"penalties_equity_no_debt_gold" numeric DEFAULT 15,
  	"penalties_cash_above25" numeric DEFAULT 20,
  	"penalties_cash10to25" numeric DEFAULT 10,
  	"penalties_short_horizon_equity" numeric DEFAULT 25,
  	"penalties_gold_above20" numeric DEFAULT 10,
  	"penalties_thematic_above30" numeric DEFAULT 15,
  	"flags_single_stock" numeric DEFAULT 20,
  	"flags_single_stock_critical" numeric DEFAULT 35,
  	"flags_top5" numeric DEFAULT 60,
  	"flags_sector" numeric DEFAULT 35,
  	"flags_equity_short_horizon" numeric DEFAULT 90,
  	"flags_cash" numeric DEFAULT 20,
  	"flags_regular_share" numeric DEFAULT 30,
  	"flags_funds_per_category" numeric DEFAULT 3,
  	"flags_equity_funds" numeric DEFAULT 8,
  	"flags_small_cap" numeric DEFAULT 25,
  	"flags_vol_ratio" numeric DEFAULT 1.3,
  	"flags_benchmark_gap" numeric DEFAULT 3,
  	"flags_unpriced" numeric DEFAULT 10,
  	"flags_thematic" numeric DEFAULT 30,
  	"severities_r01" "enum_scan_config_severities_r01" DEFAULT 'high',
  	"severities_r02" "enum_scan_config_severities_r02" DEFAULT 'high',
  	"severities_r03" "enum_scan_config_severities_r03" DEFAULT 'medium',
  	"severities_r04" "enum_scan_config_severities_r04" DEFAULT 'high',
  	"severities_r05" "enum_scan_config_severities_r05" DEFAULT 'medium',
  	"severities_r06" "enum_scan_config_severities_r06" DEFAULT 'low',
  	"severities_r07" "enum_scan_config_severities_r07" DEFAULT 'medium',
  	"severities_r08" "enum_scan_config_severities_r08" DEFAULT 'medium',
  	"severities_r09" "enum_scan_config_severities_r09" DEFAULT 'medium',
  	"severities_r10" "enum_scan_config_severities_r10" DEFAULT 'medium',
  	"severities_r11" "enum_scan_config_severities_r11" DEFAULT 'medium',
  	"severities_r12" "enum_scan_config_severities_r12" DEFAULT 'high',
  	"severities_r13" "enum_scan_config_severities_r13" DEFAULT 'info',
  	"severities_r14" "enum_scan_config_severities_r14" DEFAULT 'medium',
  	"free_flags_shown" numeric DEFAULT 3,
  	"paid_assumed_return" numeric DEFAULT 10,
  	"paid_drag_years" numeric DEFAULT 10,
  	"paid_single_stock_fall" numeric DEFAULT 30,
  	"paid_cash_yield" numeric DEFAULT 3,
  	"paid_risk_free_rate" numeric DEFAULT 6.5,
  	"max_holdings" numeric DEFAULT 500,
  	"max_file_mb" numeric DEFAULT 10,
  	"approval_reference" varchar,
  	"approval_approved_on" timestamp(3) with time zone,
  	"approval_approved_by" varchar,
  	"approval_notes" varchar,
  	"_status" "enum_scan_config_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_scan_config_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_weights_diversification" numeric DEFAULT 25,
  	"version_weights_concentration" numeric DEFAULT 20,
  	"version_weights_risk" numeric DEFAULT 20,
  	"version_weights_asset_mix" numeric DEFAULT 20,
  	"version_weights_cost" numeric DEFAULT 15,
  	"version_effective_holdings_bad" numeric DEFAULT 3,
  	"version_effective_holdings_good" numeric DEFAULT 15,
  	"version_effective_sectors_bad" numeric DEFAULT 2,
  	"version_effective_sectors_good" numeric DEFAULT 8,
  	"version_top1_bad" numeric DEFAULT 40,
  	"version_top1_good" numeric DEFAULT 10,
  	"version_top5_bad" numeric DEFAULT 80,
  	"version_top5_good" numeric DEFAULT 40,
  	"version_vol_ratio_bad" numeric DEFAULT 1.5,
  	"version_vol_ratio_good" numeric DEFAULT 0.8,
  	"version_ter_bad" numeric DEFAULT 2,
  	"version_ter_good" numeric DEFAULT 0.5,
  	"version_regular_share_bad" numeric DEFAULT 60,
  	"version_regular_share_good" numeric DEFAULT 0,
  	"version_bands_healthy" numeric DEFAULT 80,
  	"version_bands_fair" numeric DEFAULT 60,
  	"version_bands_attention" numeric DEFAULT 40,
  	"version_critical_cap" numeric DEFAULT 59,
  	"version_provisional_below" numeric DEFAULT 70,
  	"version_penalties_one_class_above90" numeric DEFAULT 30,
  	"version_penalties_one_class80to90" numeric DEFAULT 15,
  	"version_penalties_equity_no_debt_gold" numeric DEFAULT 15,
  	"version_penalties_cash_above25" numeric DEFAULT 20,
  	"version_penalties_cash10to25" numeric DEFAULT 10,
  	"version_penalties_short_horizon_equity" numeric DEFAULT 25,
  	"version_penalties_gold_above20" numeric DEFAULT 10,
  	"version_penalties_thematic_above30" numeric DEFAULT 15,
  	"version_flags_single_stock" numeric DEFAULT 20,
  	"version_flags_single_stock_critical" numeric DEFAULT 35,
  	"version_flags_top5" numeric DEFAULT 60,
  	"version_flags_sector" numeric DEFAULT 35,
  	"version_flags_equity_short_horizon" numeric DEFAULT 90,
  	"version_flags_cash" numeric DEFAULT 20,
  	"version_flags_regular_share" numeric DEFAULT 30,
  	"version_flags_funds_per_category" numeric DEFAULT 3,
  	"version_flags_equity_funds" numeric DEFAULT 8,
  	"version_flags_small_cap" numeric DEFAULT 25,
  	"version_flags_vol_ratio" numeric DEFAULT 1.3,
  	"version_flags_benchmark_gap" numeric DEFAULT 3,
  	"version_flags_unpriced" numeric DEFAULT 10,
  	"version_flags_thematic" numeric DEFAULT 30,
  	"version_severities_r01" "enum__scan_config_v_version_severities_r01" DEFAULT 'high',
  	"version_severities_r02" "enum__scan_config_v_version_severities_r02" DEFAULT 'high',
  	"version_severities_r03" "enum__scan_config_v_version_severities_r03" DEFAULT 'medium',
  	"version_severities_r04" "enum__scan_config_v_version_severities_r04" DEFAULT 'high',
  	"version_severities_r05" "enum__scan_config_v_version_severities_r05" DEFAULT 'medium',
  	"version_severities_r06" "enum__scan_config_v_version_severities_r06" DEFAULT 'low',
  	"version_severities_r07" "enum__scan_config_v_version_severities_r07" DEFAULT 'medium',
  	"version_severities_r08" "enum__scan_config_v_version_severities_r08" DEFAULT 'medium',
  	"version_severities_r09" "enum__scan_config_v_version_severities_r09" DEFAULT 'medium',
  	"version_severities_r10" "enum__scan_config_v_version_severities_r10" DEFAULT 'medium',
  	"version_severities_r11" "enum__scan_config_v_version_severities_r11" DEFAULT 'medium',
  	"version_severities_r12" "enum__scan_config_v_version_severities_r12" DEFAULT 'high',
  	"version_severities_r13" "enum__scan_config_v_version_severities_r13" DEFAULT 'info',
  	"version_severities_r14" "enum__scan_config_v_version_severities_r14" DEFAULT 'medium',
  	"version_free_flags_shown" numeric DEFAULT 3,
  	"version_paid_assumed_return" numeric DEFAULT 10,
  	"version_paid_drag_years" numeric DEFAULT 10,
  	"version_paid_single_stock_fall" numeric DEFAULT 30,
  	"version_paid_cash_yield" numeric DEFAULT 3,
  	"version_paid_risk_free_rate" numeric DEFAULT 6.5,
  	"version_max_holdings" numeric DEFAULT 500,
  	"version_max_file_mb" numeric DEFAULT 10,
  	"version_approval_reference" varchar,
  	"version_approval_approved_on" timestamp(3) with time zone,
  	"version_approval_approved_by" varchar,
  	"version_approval_notes" varchar,
  	"version__status" "enum__scan_config_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "portfolio_scan_sources" ADD CONSTRAINT "portfolio_scan_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_scan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portfolio_scan_progress" ADD CONSTRAINT "portfolio_scan_progress_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_scan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portfolio_scan_sub_scores" ADD CONSTRAINT "portfolio_scan_sub_scores_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_scan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portfolio_scan_save_prompt_benefits" ADD CONSTRAINT "portfolio_scan_save_prompt_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_scan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portfolio_scan_flags" ADD CONSTRAINT "portfolio_scan_flags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_scan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portfolio_scan_errors" ADD CONSTRAINT "portfolio_scan_errors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_scan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portfolio_scan_plans_features" ADD CONSTRAINT "portfolio_scan_plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_scan_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portfolio_scan_plans" ADD CONSTRAINT "portfolio_scan_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_scan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portfolio_scan_locked_cards" ADD CONSTRAINT "portfolio_scan_locked_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_scan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_portfolio_scan_v_version_sources" ADD CONSTRAINT "_portfolio_scan_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_scan_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_portfolio_scan_v_version_progress" ADD CONSTRAINT "_portfolio_scan_v_version_progress_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_scan_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_portfolio_scan_v_version_sub_scores" ADD CONSTRAINT "_portfolio_scan_v_version_sub_scores_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_scan_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_portfolio_scan_v_version_save_prompt_benefits" ADD CONSTRAINT "_portfolio_scan_v_version_save_prompt_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_scan_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_portfolio_scan_v_version_flags" ADD CONSTRAINT "_portfolio_scan_v_version_flags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_scan_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_portfolio_scan_v_version_errors" ADD CONSTRAINT "_portfolio_scan_v_version_errors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_scan_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_portfolio_scan_v_version_plans_features" ADD CONSTRAINT "_portfolio_scan_v_version_plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_scan_v_version_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_portfolio_scan_v_version_plans" ADD CONSTRAINT "_portfolio_scan_v_version_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_scan_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_portfolio_scan_v_version_locked_cards" ADD CONSTRAINT "_portfolio_scan_v_version_locked_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_scan_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "portfolio_scan_sources_order_idx" ON "portfolio_scan_sources" USING btree ("_order");
  CREATE INDEX "portfolio_scan_sources_parent_id_idx" ON "portfolio_scan_sources" USING btree ("_parent_id");
  CREATE INDEX "portfolio_scan_progress_order_idx" ON "portfolio_scan_progress" USING btree ("_order");
  CREATE INDEX "portfolio_scan_progress_parent_id_idx" ON "portfolio_scan_progress" USING btree ("_parent_id");
  CREATE INDEX "portfolio_scan_sub_scores_order_idx" ON "portfolio_scan_sub_scores" USING btree ("_order");
  CREATE INDEX "portfolio_scan_sub_scores_parent_id_idx" ON "portfolio_scan_sub_scores" USING btree ("_parent_id");
  CREATE INDEX "portfolio_scan_save_prompt_benefits_order_idx" ON "portfolio_scan_save_prompt_benefits" USING btree ("_order");
  CREATE INDEX "portfolio_scan_save_prompt_benefits_parent_id_idx" ON "portfolio_scan_save_prompt_benefits" USING btree ("_parent_id");
  CREATE INDEX "portfolio_scan_flags_order_idx" ON "portfolio_scan_flags" USING btree ("_order");
  CREATE INDEX "portfolio_scan_flags_parent_id_idx" ON "portfolio_scan_flags" USING btree ("_parent_id");
  CREATE INDEX "portfolio_scan_errors_order_idx" ON "portfolio_scan_errors" USING btree ("_order");
  CREATE INDEX "portfolio_scan_errors_parent_id_idx" ON "portfolio_scan_errors" USING btree ("_parent_id");
  CREATE INDEX "portfolio_scan_plans_features_order_idx" ON "portfolio_scan_plans_features" USING btree ("_order");
  CREATE INDEX "portfolio_scan_plans_features_parent_id_idx" ON "portfolio_scan_plans_features" USING btree ("_parent_id");
  CREATE INDEX "portfolio_scan_plans_order_idx" ON "portfolio_scan_plans" USING btree ("_order");
  CREATE INDEX "portfolio_scan_plans_parent_id_idx" ON "portfolio_scan_plans" USING btree ("_parent_id");
  CREATE INDEX "portfolio_scan_locked_cards_order_idx" ON "portfolio_scan_locked_cards" USING btree ("_order");
  CREATE INDEX "portfolio_scan_locked_cards_parent_id_idx" ON "portfolio_scan_locked_cards" USING btree ("_parent_id");
  CREATE INDEX "portfolio_scan__status_idx" ON "portfolio_scan" USING btree ("_status");
  CREATE INDEX "_portfolio_scan_v_version_sources_order_idx" ON "_portfolio_scan_v_version_sources" USING btree ("_order");
  CREATE INDEX "_portfolio_scan_v_version_sources_parent_id_idx" ON "_portfolio_scan_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_portfolio_scan_v_version_progress_order_idx" ON "_portfolio_scan_v_version_progress" USING btree ("_order");
  CREATE INDEX "_portfolio_scan_v_version_progress_parent_id_idx" ON "_portfolio_scan_v_version_progress" USING btree ("_parent_id");
  CREATE INDEX "_portfolio_scan_v_version_sub_scores_order_idx" ON "_portfolio_scan_v_version_sub_scores" USING btree ("_order");
  CREATE INDEX "_portfolio_scan_v_version_sub_scores_parent_id_idx" ON "_portfolio_scan_v_version_sub_scores" USING btree ("_parent_id");
  CREATE INDEX "_portfolio_scan_v_version_save_prompt_benefits_order_idx" ON "_portfolio_scan_v_version_save_prompt_benefits" USING btree ("_order");
  CREATE INDEX "_portfolio_scan_v_version_save_prompt_benefits_parent_id_idx" ON "_portfolio_scan_v_version_save_prompt_benefits" USING btree ("_parent_id");
  CREATE INDEX "_portfolio_scan_v_version_flags_order_idx" ON "_portfolio_scan_v_version_flags" USING btree ("_order");
  CREATE INDEX "_portfolio_scan_v_version_flags_parent_id_idx" ON "_portfolio_scan_v_version_flags" USING btree ("_parent_id");
  CREATE INDEX "_portfolio_scan_v_version_errors_order_idx" ON "_portfolio_scan_v_version_errors" USING btree ("_order");
  CREATE INDEX "_portfolio_scan_v_version_errors_parent_id_idx" ON "_portfolio_scan_v_version_errors" USING btree ("_parent_id");
  CREATE INDEX "_portfolio_scan_v_version_plans_features_order_idx" ON "_portfolio_scan_v_version_plans_features" USING btree ("_order");
  CREATE INDEX "_portfolio_scan_v_version_plans_features_parent_id_idx" ON "_portfolio_scan_v_version_plans_features" USING btree ("_parent_id");
  CREATE INDEX "_portfolio_scan_v_version_plans_order_idx" ON "_portfolio_scan_v_version_plans" USING btree ("_order");
  CREATE INDEX "_portfolio_scan_v_version_plans_parent_id_idx" ON "_portfolio_scan_v_version_plans" USING btree ("_parent_id");
  CREATE INDEX "_portfolio_scan_v_version_locked_cards_order_idx" ON "_portfolio_scan_v_version_locked_cards" USING btree ("_order");
  CREATE INDEX "_portfolio_scan_v_version_locked_cards_parent_id_idx" ON "_portfolio_scan_v_version_locked_cards" USING btree ("_parent_id");
  CREATE INDEX "_portfolio_scan_v_version_version__status_idx" ON "_portfolio_scan_v" USING btree ("version__status");
  CREATE INDEX "_portfolio_scan_v_created_at_idx" ON "_portfolio_scan_v" USING btree ("created_at");
  CREATE INDEX "_portfolio_scan_v_updated_at_idx" ON "_portfolio_scan_v" USING btree ("updated_at");
  CREATE INDEX "_portfolio_scan_v_latest_idx" ON "_portfolio_scan_v" USING btree ("latest");
  CREATE INDEX "scan_config__status_idx" ON "scan_config" USING btree ("_status");
  CREATE INDEX "_scan_config_v_version_version__status_idx" ON "_scan_config_v" USING btree ("version__status");
  CREATE INDEX "_scan_config_v_created_at_idx" ON "_scan_config_v" USING btree ("created_at");
  CREATE INDEX "_scan_config_v_updated_at_idx" ON "_scan_config_v" USING btree ("updated_at");
  CREATE INDEX "_scan_config_v_latest_idx" ON "_scan_config_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "portfolio_scan_sources" CASCADE;
  DROP TABLE "portfolio_scan_progress" CASCADE;
  DROP TABLE "portfolio_scan_sub_scores" CASCADE;
  DROP TABLE "portfolio_scan_save_prompt_benefits" CASCADE;
  DROP TABLE "portfolio_scan_flags" CASCADE;
  DROP TABLE "portfolio_scan_errors" CASCADE;
  DROP TABLE "portfolio_scan_plans_features" CASCADE;
  DROP TABLE "portfolio_scan_plans" CASCADE;
  DROP TABLE "portfolio_scan_locked_cards" CASCADE;
  DROP TABLE "portfolio_scan" CASCADE;
  DROP TABLE "_portfolio_scan_v_version_sources" CASCADE;
  DROP TABLE "_portfolio_scan_v_version_progress" CASCADE;
  DROP TABLE "_portfolio_scan_v_version_sub_scores" CASCADE;
  DROP TABLE "_portfolio_scan_v_version_save_prompt_benefits" CASCADE;
  DROP TABLE "_portfolio_scan_v_version_flags" CASCADE;
  DROP TABLE "_portfolio_scan_v_version_errors" CASCADE;
  DROP TABLE "_portfolio_scan_v_version_plans_features" CASCADE;
  DROP TABLE "_portfolio_scan_v_version_plans" CASCADE;
  DROP TABLE "_portfolio_scan_v_version_locked_cards" CASCADE;
  DROP TABLE "_portfolio_scan_v" CASCADE;
  DROP TABLE "scan_config" CASCADE;
  DROP TABLE "_scan_config_v" CASCADE;
  DROP TYPE "public"."enum_portfolio_scan_sub_scores_sub_score";
  DROP TYPE "public"."enum_portfolio_scan_flags_rule";
  DROP TYPE "public"."enum_portfolio_scan_errors_code";
  DROP TYPE "public"."enum_portfolio_scan_plans_plan_id";
  DROP TYPE "public"."enum_portfolio_scan_locked_cards_card";
  DROP TYPE "public"."enum_portfolio_scan_locked_cards_plan";
  DROP TYPE "public"."enum_portfolio_scan_status";
  DROP TYPE "public"."enum__portfolio_scan_v_version_sub_scores_sub_score";
  DROP TYPE "public"."enum__portfolio_scan_v_version_flags_rule";
  DROP TYPE "public"."enum__portfolio_scan_v_version_errors_code";
  DROP TYPE "public"."enum__portfolio_scan_v_version_plans_plan_id";
  DROP TYPE "public"."enum__portfolio_scan_v_version_locked_cards_card";
  DROP TYPE "public"."enum__portfolio_scan_v_version_locked_cards_plan";
  DROP TYPE "public"."enum__portfolio_scan_v_version_status";
  DROP TYPE "public"."enum_scan_config_severities_r01";
  DROP TYPE "public"."enum_scan_config_severities_r02";
  DROP TYPE "public"."enum_scan_config_severities_r03";
  DROP TYPE "public"."enum_scan_config_severities_r04";
  DROP TYPE "public"."enum_scan_config_severities_r05";
  DROP TYPE "public"."enum_scan_config_severities_r06";
  DROP TYPE "public"."enum_scan_config_severities_r07";
  DROP TYPE "public"."enum_scan_config_severities_r08";
  DROP TYPE "public"."enum_scan_config_severities_r09";
  DROP TYPE "public"."enum_scan_config_severities_r10";
  DROP TYPE "public"."enum_scan_config_severities_r11";
  DROP TYPE "public"."enum_scan_config_severities_r12";
  DROP TYPE "public"."enum_scan_config_severities_r13";
  DROP TYPE "public"."enum_scan_config_severities_r14";
  DROP TYPE "public"."enum_scan_config_status";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r01";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r02";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r03";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r04";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r05";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r06";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r07";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r08";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r09";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r10";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r11";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r12";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r13";
  DROP TYPE "public"."enum__scan_config_v_version_severities_r14";
  DROP TYPE "public"."enum__scan_config_v_version_status";`)
}
