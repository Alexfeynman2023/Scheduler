/*
  Warnings:

  - Made the column `googleEventId` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "linkedinUrl" TEXT,
ALTER COLUMN "googleEventId" SET NOT NULL;
