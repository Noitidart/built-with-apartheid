/*
  Warnings:

  - You are about to drop the column `userIp` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `userIp` on the `Scan` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InteractionType" ADD VALUE 'MOD_ADDED';
ALTER TYPE "InteractionType" ADD VALUE 'MOD_REMOVED';

-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN     "userIp" TEXT,
ALTER COLUMN "websiteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Milestone" ALTER COLUMN "websiteId" DROP NOT NULL;

-- Migrate userIp data from Scan to Interaction
UPDATE "Interaction" i
SET "userIp" = s."userIp"
FROM "Scan" s
WHERE i."id" = s."interactionId";

-- Migrate userIp data from Post to Interaction
UPDATE "Interaction" i
SET "userIp" = p."userIp"
FROM "Post" p
WHERE i."id" = p."interactionId";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "userIp";

-- AlterTable
ALTER TABLE "Scan" DROP COLUMN "userIp";
