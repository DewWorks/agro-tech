-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_branchId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "branchId" DROP NOT NULL,
ALTER COLUMN "fullName" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
