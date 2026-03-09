-- Create Stripe pricing enums if they dont exist
CREATE TYPE IF NOT EXISTS "pricing_type" AS ENUM('recurring', 'one_time');
CREATE TYPE IF NOT EXISTS "pricing_plan_interval" AS ENUM('year', 'month', 'week', 'day');

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"billing_address" jsonb,
	"updated_at" timestamp with time zone,
	"payment_method" jsonb,
	"email" text
);
--> statement-breakpoint
-- Create customers table
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"stripe_customer_id" text
);
--> statement-breakpoint
-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
	"id" text PRIMARY KEY NOT NULL,
	"active" boolean,
	"name" text,
	"description" text,
	"image" text,
	"metadata" jsonb
);
--> statement-breakpoint
-- Create prices table
CREATE TABLE IF NOT EXISTS "prices" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text REFERENCES "products"("id"),
	"active" boolean,
	"description" text,
	"unit_amount" bigint,
	"currency" text,
	"type" "pricing_type",
	"interval" "pricing_plan_interval",
	"interval_count" integer,
	"trial_period_days" integer,
	"metadata" jsonb
);
