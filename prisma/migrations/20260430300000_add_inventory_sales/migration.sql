-- CreateTable
CREATE TABLE "InventoryItemSale" (
    "id"              TEXT         NOT NULL,
    "inventoryItemId" TEXT         NOT NULL,
    "qtySold"         INTEGER      NOT NULL DEFAULT 1,
    "priceSold"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dateSold"        TEXT,
    "notes"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItemSale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InventoryItemSale"
    ADD CONSTRAINT "InventoryItemSale_inventoryItemId_fkey"
    FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing sold items: create one sale record per item that had dateSold set
INSERT INTO "InventoryItemSale" ("id", "inventoryItemId", "qtySold", "priceSold", "dateSold", "createdAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "qty",
    "priceSold",
    "dateSold",
    NOW()
FROM "InventoryItem"
WHERE "dateSold" IS NOT NULL AND "priceSold" > 0;
