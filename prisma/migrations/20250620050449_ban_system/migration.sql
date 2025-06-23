/*
  Warnings:

  - You are about to drop the column `userIp` on the `Interaction` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InteractionType" ADD VALUE 'BANNED_USER';
ALTER TYPE "InteractionType" ADD VALUE 'UNBANNED_USER';
ALTER TYPE "InteractionType" ADD VALUE 'BANNED_IPS';
ALTER TYPE "InteractionType" ADD VALUE 'UNBANNED_IPS';

-- AlterTable
ALTER TABLE "Interaction" DROP COLUMN "userIp",
ADD COLUMN     "data" JSONB,
ADD COLUMN     "ipId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Ip" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "postalCode" TEXT,
    "metroCode" TEXT,
    "region" TEXT,
    "regionCode" TEXT,
    "timezone" TEXT,
    "botScore" INTEGER,
    "isVerifiedBot" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IpToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IpToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InteractionTargetUsers" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InteractionTargetUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InteractionTargetIps" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_InteractionTargetIps_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ip_value_key" ON "Ip"("value");

-- CreateIndex
CREATE INDEX "_IpToUser_B_index" ON "_IpToUser"("B");

-- CreateIndex
CREATE INDEX "_InteractionTargetUsers_B_index" ON "_InteractionTargetUsers"("B");

-- CreateIndex
CREATE INDEX "_InteractionTargetIps_B_index" ON "_InteractionTargetIps"("B");

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_ipId_fkey" FOREIGN KEY ("ipId") REFERENCES "Ip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IpToUser" ADD CONSTRAINT "_IpToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Ip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IpToUser" ADD CONSTRAINT "_IpToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InteractionTargetUsers" ADD CONSTRAINT "_InteractionTargetUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InteractionTargetUsers" ADD CONSTRAINT "_InteractionTargetUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InteractionTargetIps" ADD CONSTRAINT "_InteractionTargetIps_A_fkey" FOREIGN KEY ("A") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InteractionTargetIps" ADD CONSTRAINT "_InteractionTargetIps_B_fkey" FOREIGN KEY ("B") REFERENCES "Ip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
