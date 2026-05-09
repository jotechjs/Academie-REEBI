-- CreateEnum
CREATE TYPE "public"."SessionColumnDataType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE');

-- CreateTable
CREATE TABLE "public"."learners" (
    "id" UUID NOT NULL,
    "institutionId" UUID,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" UUID NOT NULL,
    "institutionId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_columns" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "dataType" "public"."SessionColumnDataType" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_values" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "sessionColumnId" UUID NOT NULL,
    "learnerId" UUID NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learners_institutionId_idx" ON "public"."learners"("institutionId");

-- CreateIndex
CREATE INDEX "learners_lastName_firstName_idx" ON "public"."learners"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "sessions_institutionId_idx" ON "public"."sessions"("institutionId");

-- CreateIndex
CREATE INDEX "sessions_name_idx" ON "public"."sessions"("name");

-- CreateIndex
CREATE INDEX "session_columns_sessionId_position_idx" ON "public"."session_columns"("sessionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "session_columns_sessionId_name_key" ON "public"."session_columns"("sessionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "session_columns_id_sessionId_key" ON "public"."session_columns"("id", "sessionId");

-- CreateIndex
CREATE INDEX "session_values_learnerId_idx" ON "public"."session_values"("learnerId");

-- CreateIndex
CREATE INDEX "session_values_sessionId_learnerId_idx" ON "public"."session_values"("sessionId", "learnerId");

-- CreateIndex
CREATE INDEX "session_values_sessionId_sessionColumnId_idx" ON "public"."session_values"("sessionId", "sessionColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "session_values_sessionId_sessionColumnId_learnerId_key" ON "public"."session_values"("sessionId", "sessionColumnId", "learnerId");

-- AddForeignKey
ALTER TABLE "public"."session_columns" ADD CONSTRAINT "session_columns_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_values" ADD CONSTRAINT "session_values_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_values" ADD CONSTRAINT "session_values_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "public"."learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_values" ADD CONSTRAINT "session_values_sessionColumnId_sessionId_fkey" FOREIGN KEY ("sessionColumnId", "sessionId") REFERENCES "public"."session_columns"("id", "sessionId") ON DELETE CASCADE ON UPDATE CASCADE;
