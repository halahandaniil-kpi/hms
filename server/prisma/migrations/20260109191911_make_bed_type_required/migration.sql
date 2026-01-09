/*
  Warnings:

  - Made the column `bedTypeId` on table `RoomType` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "RoomType" DROP CONSTRAINT "RoomType_bedTypeId_fkey";

-- AlterTable
ALTER TABLE "RoomType" ALTER COLUMN "bedTypeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_bedTypeId_fkey" FOREIGN KEY ("bedTypeId") REFERENCES "BedType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
