-- AlterTable
ALTER TABLE "user" ADD COLUMN "normalizedEmail" TEXT;

-- Backfill from existing emails (harmony normalizer may differ for Gmail aliases in production)
UPDATE "user" SET "normalizedEmail" = LOWER(TRIM("email")) WHERE "normalizedEmail" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_normalizedEmail_key" ON "user"("normalizedEmail");
