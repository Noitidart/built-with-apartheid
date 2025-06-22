-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InteractionType" ADD VALUE 'WATCHED';
ALTER TYPE "InteractionType" ADD VALUE 'UNWATCHED';

-- CreateTable
CREATE TABLE "_WatchedWebsites" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_WatchedWebsites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_WatchedWebsites_B_index" ON "_WatchedWebsites"("B");

-- AddForeignKey
ALTER TABLE "_WatchedWebsites" ADD CONSTRAINT "_WatchedWebsites_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WatchedWebsites" ADD CONSTRAINT "_WatchedWebsites_B_fkey" FOREIGN KEY ("B") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
