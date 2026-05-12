-- CreateEnum
CREATE TYPE "public"."LearnerStatus" AS ENUM ('PENDING', 'ADMITTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."DecisionJury" AS ENUM ('ADMIS', 'NON_ADMIS');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'LEARNER');

-- DropForeignKey
ALTER TABLE "public"."session_columns" DROP CONSTRAINT "session_columns_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."session_values" DROP CONSTRAINT "session_values_sessionColumnId_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."session_values" DROP CONSTRAINT "session_values_sessionId_fkey";

-- DropIndex
DROP INDEX "public"."session_columns_id_sessionId_key";

-- DropIndex
DROP INDEX "public"."session_columns_sessionId_name_key";

-- DropIndex
DROP INDEX "public"."session_columns_sessionId_position_idx";

-- DropIndex
DROP INDEX "public"."session_values_sessionId_learnerId_idx";

-- DropIndex
DROP INDEX "public"."session_values_sessionId_sessionColumnId_idx";

-- DropIndex
DROP INDEX "public"."session_values_sessionId_sessionColumnId_learnerId_key";

-- AlterTable
ALTER TABLE "public"."learners"
ADD COLUMN     "decisionJury" "public"."DecisionJury" NOT NULL DEFAULT 'NON_ADMIS',
ADD COLUMN     "eval_oral" DOUBLE PRECISION,
ADD COLUMN     "identifiant" TEXT,
ADD COLUMN     "moyenneCours" DOUBLE PRECISION,
ADD COLUMN     "moyenneGenerale" DOUBLE PRECISION,
ADD COLUMN     "moyenne_ecrit" DOUBLE PRECISION,
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'LEARNER',
ADD COLUMN     "status" "public"."LearnerStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."session_columns"
DROP COLUMN "sessionId",
ADD COLUMN     "sessionSheetId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."session_values"
DROP COLUMN "sessionId",
ADD COLUMN     "sessionSheetId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "public"."experiences" (
    "id" UUID NOT NULL,
    "learnerId" UUID NOT NULL,
    "answer1" TEXT NOT NULL,
    "answer2" TEXT NOT NULL,
    "answer3" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_sheets" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experiences_learnerId_idx" ON "public"."experiences"("learnerId");

-- CreateIndex
CREATE INDEX "session_sheets_sessionId_idx" ON "public"."session_sheets"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "learners_identifiant_key" ON "public"."learners"("identifiant");

-- CreateIndex
CREATE UNIQUE INDEX "learners_email_key" ON "public"."learners"("email");

-- CreateIndex
CREATE INDEX "session_columns_sessionSheetId_position_idx" ON "public"."session_columns"("sessionSheetId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "session_columns_sessionSheetId_name_key" ON "public"."session_columns"("sessionSheetId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "session_columns_id_sessionSheetId_key" ON "public"."session_columns"("id", "sessionSheetId");

-- CreateIndex
CREATE INDEX "session_values_sessionSheetId_learnerId_idx" ON "public"."session_values"("sessionSheetId", "learnerId");

-- CreateIndex
CREATE INDEX "session_values_sessionSheetId_sessionColumnId_idx" ON "public"."session_values"("sessionSheetId", "sessionColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "session_values_sessionSheetId_sessionColumnId_learnerId_key" ON "public"."session_values"("sessionSheetId", "sessionColumnId", "learnerId");

-- AddForeignKey
ALTER TABLE "public"."experiences" ADD CONSTRAINT "experiences_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "public"."learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_sheets" ADD CONSTRAINT "session_sheets_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_columns" ADD CONSTRAINT "session_columns_sessionSheetId_fkey" FOREIGN KEY ("sessionSheetId") REFERENCES "public"."session_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_values" ADD CONSTRAINT "session_values_sessionSheetId_fkey" FOREIGN KEY ("sessionSheetId") REFERENCES "public"."session_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_values" ADD CONSTRAINT "session_values_sessionColumnId_sessionSheetId_fkey" FOREIGN KEY ("sessionColumnId", "sessionSheetId") REFERENCES "public"."session_columns"("id", "sessionSheetId") ON DELETE CASCADE ON UPDATE CASCADE;
