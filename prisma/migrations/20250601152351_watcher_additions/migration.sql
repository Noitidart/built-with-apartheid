-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSubscribed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Website" ADD COLUMN     "isUnethical" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_WebsiteWatchers" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_WebsiteWatchers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_WebsiteWatchers_B_index" ON "_WebsiteWatchers"("B");

-- AddForeignKey
ALTER TABLE "_WebsiteWatchers" ADD CONSTRAINT "_WebsiteWatchers_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WebsiteWatchers" ADD CONSTRAINT "_WebsiteWatchers_B_fkey" FOREIGN KEY ("B") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
