CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"model" varchar(100),
	"model_name" varchar(100),
	"tokens_prompt" integer,
	"tokens_completion" integer,
	"tokens_total" integer,
	"latency_ms" integer,
	"safety_check" jsonb DEFAULT '{}'::jsonb,
	"confidence" numeric(3, 2),
	"user_birth_date" date,
	"user_period" varchar(20),
	"derived_context" jsonb DEFAULT '{}'::jsonb,
	"feedback_rating" smallint,
	"feedback_tags" jsonb DEFAULT '[]'::jsonb,
	"flagged" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"birth_date" date,
	"period" varchar(20),
	"model" varchar(100),
	"message_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "horotoken_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance_before" integer NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"transaction_type" varchar(20) NOT NULL,
	"reference_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" varchar(50) NOT NULL,
	"topic" varchar(100) NOT NULL,
	"tier" integer DEFAULT 1,
	"priority" varchar(2) DEFAULT 'P1',
	"content" text NOT NULL,
	"frontmatter" jsonb DEFAULT '{}'::jsonb,
	"version" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proactive_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"message_type" varchar(30) NOT NULL,
	"reading_type" varchar(20),
	"content" jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reading_type" varchar(20) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date,
	"sources_used" jsonb DEFAULT '[]'::jsonb,
	"tier_used" integer DEFAULT 1,
	"user_question" text,
	"source_readings" jsonb DEFAULT '{}'::jsonb,
	"convergence" jsonb DEFAULT '{}'::jsonb,
	"output" jsonb DEFAULT '{}'::jsonb,
	"safety_check" jsonb DEFAULT '{}'::jsonb,
	"horotoken_cost" integer DEFAULT 1,
	"shrine_recommendations" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "satisfaction_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reading_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"feedback_tags" jsonb DEFAULT '[]'::jsonb,
	"free_text" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"state" varchar(30) DEFAULT 'idle',
	"state_data" jsonb DEFAULT '{}'::jsonb,
	"last_reading_type" varchar(20),
	"last_reading_at" timestamp with time zone,
	"readings_today" integer DEFAULT 0,
	"readings_today_date" date,
	"onboarding_step" integer DEFAULT 0,
	"onboarding_complete" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "shrines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_th" varchar(200) NOT NULL,
	"name_en" varchar(200),
	"description" text,
	"location" jsonb NOT NULL,
	"deity" jsonb DEFAULT '[]'::jsonb,
	"religion" varchar(20),
	"tradition" jsonb DEFAULT '[]'::jsonb,
	"suitable_for" jsonb DEFAULT '[]'::jsonb,
	"worship_guide" jsonb DEFAULT '{}'::jsonb,
	"popularity" integer DEFAULT 0,
	"rating" numeric(2, 1) DEFAULT '0.0',
	"detail" jsonb DEFAULT '{}'::jsonb,
	"transport" jsonb DEFAULT '{}'::jsonb,
	"tips" jsonb DEFAULT '{}'::jsonb,
	"stories" jsonb DEFAULT '{}'::jsonb,
	"extras" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"birth_date" date,
	"birth_time" time,
	"birth_location" jsonb,
	"thai_rasi" varchar(20),
	"western_sign" varchar(20),
	"chinese_zodiac" varchar(20),
	"life_path_number" integer,
	"birth_day_of_week" varchar(15),
	"element_thai" varchar(10),
	"element_chinese" varchar(10),
	"lagna" varchar(20),
	"western_rising" varchar(20),
	"sawaey_ayu" jsonb,
	"naksatra" varchar(30),
	"thaksa" varchar(20),
	"preferred_topics" jsonb DEFAULT '["general"]'::jsonb,
	"reading_frequency" varchar(20) DEFAULT 'daily',
	"shrine_preferences" jsonb DEFAULT '{}'::jsonb,
	"custom_pronoun" varchar(20),
	"profile_tier" integer DEFAULT 1,
	"missing_data" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"line_user_id" varchar(64) NOT NULL,
	"display_name" varchar(100),
	"pronoun" varchar(20) DEFAULT 'คุณ',
	"age_verified" boolean DEFAULT false,
	"age_gate" jsonb,
	"consent_records" jsonb DEFAULT '[]'::jsonb,
	"tier" varchar(10) DEFAULT 'free',
	"horotoken_balance" integer DEFAULT 5,
	"status" varchar(20) DEFAULT 'active',
	"self_exclude_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_active_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_line_user_id_unique" UNIQUE("line_user_id")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horotoken_transactions" ADD CONSTRAINT "horotoken_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proactive_messages" ADD CONSTRAINT "proactive_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "satisfaction_ratings" ADD CONSTRAINT "satisfaction_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "satisfaction_ratings" ADD CONSTRAINT "satisfaction_ratings_reading_id_readings_id_fk" FOREIGN KEY ("reading_id") REFERENCES "public"."readings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;