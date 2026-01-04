/*
  Warnings:

  - A unique constraint covering the columns `[installationId,repoId]` on the table `Installation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Installation_installationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Installation_installationId_repoId_key" ON "Installation"("installationId", "repoId");
