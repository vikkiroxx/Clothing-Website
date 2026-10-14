-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('MEN', 'WOMEN', 'KIDS');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "audience" "Audience";
