-- CreateTable
CREATE TABLE "Adjustment" (
    "id" SERIAL NOT NULL,
    "desc" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Income',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adjustment_pkey" PRIMARY KEY ("id")
);
