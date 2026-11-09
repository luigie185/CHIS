-- Roles reduced to admin | doctor | staff (IMPLEMENTATION_PLAN.md §4.1).
-- Existing nurse / midwife / encoder accounts become staff; their old role is kept as the job title.
ALTER TABLE "staff_profiles" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'staff'::text;--> statement-breakpoint
UPDATE "staff_profiles" SET "position" = initcap(u."role") FROM "user" u
  WHERE u."id" = "staff_profiles"."user_id" AND u."role" IN ('nurse', 'midwife', 'encoder') AND "staff_profiles"."position" IS NULL;--> statement-breakpoint
UPDATE "user" SET "role" = 'staff' WHERE "role" NOT IN ('admin', 'doctor', 'staff');--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'doctor', 'staff');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'staff'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";
