-- CreateTable
CREATE TABLE "Invoice" (
    "id"          SERIAL       NOT NULL,
    "number"      TEXT         NOT NULL,
    "type"        TEXT         NOT NULL DEFAULT 'Invoice',
    "date"        TEXT,
    "dueDate"     TEXT,
    "clientName"  TEXT         NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "clientAddr"  TEXT,
    "notes"       TEXT,
    "status"      TEXT         NOT NULL DEFAULT 'Draft',
    "subtotal"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax"         DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id"              SERIAL NOT NULL,
    "invoiceId"       INTEGER NOT NULL,
    "description"     TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "qty"             DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total"           DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
