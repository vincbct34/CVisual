-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Resume_parentId_idx" ON "Resume"("parentId");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
