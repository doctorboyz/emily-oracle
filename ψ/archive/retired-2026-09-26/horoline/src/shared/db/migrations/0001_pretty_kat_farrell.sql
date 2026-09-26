CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"actor_type" varchar(20) DEFAULT 'system',
	"actor_id" varchar(100),
	"session_id" varchar(100),
	"user_id" uuid,
	"details" jsonb DEFAULT '{}'::jsonb,
	"prompt_version" varchar(20) DEFAULT 'v1',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reading_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"session_id" varchar(100),
	"safety_score" integer,
	"quality_score" integer,
	"cost_efficiency" integer,
	"safety_flags_count" integer DEFAULT 0,
	"has_reframe" boolean DEFAULT false,
	"has_disclaimer" boolean DEFAULT false,
	"has_practical_advice" boolean DEFAULT false,
	"response_length_bucket" varchar(10),
	"user_rating" smallint,
	"tokens_per_char_ratio" numeric(5, 2),
	"prompt_version" varchar(20) DEFAULT 'v1',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reading_scores_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "line_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "prompt_version" varchar(20) DEFAULT 'v1';--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "anonymous_id" varchar(64);--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "fingerprint" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "status" varchar(20) DEFAULT 'created';--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "anonymous_id" varchar(64);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_scores" ADD CONSTRAINT "reading_scores_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_scores" ADD CONSTRAINT "reading_scores_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_anonymous_id_unique" UNIQUE("anonymous_id");