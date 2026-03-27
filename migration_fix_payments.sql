-- migration_fix_payments.sql
-- Fix cheques table to support customer sales (Bank/Cheque) and references
ALTER TABLE "public"."cheques" ALTER COLUMN "vendor_id" DROP NOT NULL;
ALTER TABLE "public"."cheques" ADD COLUMN IF NOT EXISTS "customer_id" UUID REFERENCES "public"."customers"("id");
ALTER TABLE "public"."cheques" ADD COLUMN IF NOT EXISTS "reference_id" UUID;
ALTER TABLE "public"."cheques" ADD COLUMN IF NOT EXISTS "reference_type" TEXT;

-- For tracking sales payments, reference_type will be 'SALE', reference_id will be the sale UUID.
-- For purchase payments, reference_type will be 'VENDOR_PURCHASE', reference_id will be purchase UUID.

-- Fix vendor_payments table: removing the unused 'purchase_id' references 
-- (According to schema v2.1, vendor_payments already has reference_id and reference_type, 
-- but we must ensure they are properly sized/indexed if needed)
CREATE INDEX IF NOT EXISTS idx_cheques_ref ON "public"."cheques"("reference_id", "reference_type");
CREATE INDEX IF NOT EXISTS idx_cheques_customer ON "public"."cheques"("customer_id");
