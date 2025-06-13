/*
  Warnings:

  - Added the required column `dataInteractionId` to the `Milestone` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "dataInteractionId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_dataInteractionId_fkey" FOREIGN KEY ("dataInteractionId") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
