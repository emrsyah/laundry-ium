-- CreateTable: services
CREATE TABLE IF NOT EXISTS "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"price" integer NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- CreateTable: order_items
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
	"service_id" integer REFERENCES "services"("id"),
	"service_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"subtotal" integer NOT NULL
);

-- AlterTable: customers
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "balance" integer DEFAULT 0;

-- AlterTable: orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "status_new" text DEFAULT 'PENDING';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'BELUM_BAYAR';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "amount_paid" integer DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "estimated_completion" timestamp;

-- Migrate existing status values to status_new
UPDATE "orders" SET "status_new" = "status" WHERE "status_new" IS NULL;

-- Drop old status column
ALTER TABLE "orders" DROP COLUMN IF EXISTS "type";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "status";

-- Rename status_new to status
ALTER TABLE "orders" RENAME COLUMN "status_new" TO "status";
