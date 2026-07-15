-- Idempotent migration: safe if partially applied earlier.

-- Referral columns on user
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "referredByUserId" TEXT;

-- Backfill referral codes for existing users
UPDATE "user"
SET "referralCode" = 'ref_' || substr(md5(id || email), 1, 16)
WHERE "referralCode" IS NULL;

ALTER TABLE "user" ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "user_referralCode_key" ON "user"("referralCode");
CREATE INDEX IF NOT EXISTS "user_referredByUserId_idx" ON "user"("referredByUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_referredByUserId_fkey'
  ) THEN
    ALTER TABLE "user"
      ADD CONSTRAINT "user_referredByUserId_fkey"
      FOREIGN KEY ("referredByUserId") REFERENCES "user"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Session / invitation team fields
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "activeTeamId" TEXT;
ALTER TABLE "invitation" ADD COLUMN IF NOT EXISTS "teamId" TEXT;

-- Team tables
CREATE TABLE IF NOT EXISTS "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "teamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "teamMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "team_organizationId_idx" ON "team"("organizationId");
CREATE INDEX IF NOT EXISTS "teamMember_teamId_idx" ON "teamMember"("teamId");
CREATE INDEX IF NOT EXISTS "teamMember_userId_idx" ON "teamMember"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'team_organizationId_fkey'
  ) THEN
    ALTER TABLE "team"
      ADD CONSTRAINT "team_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teamMember_teamId_fkey'
  ) THEN
    ALTER TABLE "teamMember"
      ADD CONSTRAINT "teamMember_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "team"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teamMember_userId_fkey'
  ) THEN
    ALTER TABLE "teamMember"
      ADD CONSTRAINT "teamMember_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
