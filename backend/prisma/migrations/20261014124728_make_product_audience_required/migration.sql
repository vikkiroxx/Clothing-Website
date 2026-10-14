/*
  Warnings:

  - Made the column `audience` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "audience" SET NOT NULL;
