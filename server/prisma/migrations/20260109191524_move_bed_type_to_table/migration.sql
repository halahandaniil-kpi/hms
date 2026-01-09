/*
  Warnings:

  - You are about to drop the column `bedType` on the `RoomType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RoomType" DROP COLUMN "bedType",
ADD COLUMN     "bedTypeId" INTEGER;

-- CreateTable
CREATE TABLE "BedType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BedType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BedType_name_key" ON "BedType"("name");

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_bedTypeId_fkey" FOREIGN KEY ("bedTypeId") REFERENCES "BedType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
