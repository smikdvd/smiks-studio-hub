export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ReportsClient from "@/components/ReportsClient";

export default async function ReportsPage() {
  const [sessions, expenses, inventory, soldItems, adjustments] = await Promise.all([
    prisma.studioSession.findMany({
      select: { id: true, client: true, netRevenue: true, payStatus: true, type: true, date: true },
      orderBy: { date: "asc" },
    }),
    prisma.expense.findMany({
      select: { id: true, desc: true, amount: true, category: true, date: true, vendor: true, payMethod: true },
      orderBy: { date: "asc" },
    }),
    prisma.inventoryItem.findMany({
      select: { priceBought: true, priceSold: true, status: true, qty: true },
    }),
    // Use the InventoryItemSale table for accurate per-unit sold tracking
    prisma.inventoryItemSale.findMany({
      include: {
        inventoryItem: {
          select: { id: true, name: true, brand: true, category: true, priceBought: true },
        },
      },
      orderBy: { dateSold: "asc" },
    }),
    prisma.adjustment.findMany({ orderBy: { date: "asc" } }),
  ]);

  const serializedSessions = sessions.map(s => ({
    ...s,
    date: s.date ? new Date(s.date).toISOString().split("T")[0] : null,
  }));
  const serializedExpenses = expenses.map(e => ({
    ...e,
    date: e.date ? new Date(e.date).toISOString().split("T")[0] : null,
  }));

  // Flatten sale records into the shape ReportsClient expects
  const serializedSoldItems = soldItems.map(sale => ({
    saleId: sale.id,
    itemId: sale.inventoryItem.id,
    name: sale.inventoryItem.name,
    brand: sale.inventoryItem.brand,
    category: sale.inventoryItem.category,
    priceBought: sale.inventoryItem.priceBought,
    priceSold: sale.priceSold,
    dateSold: sale.dateSold,
    qty: sale.qtySold,
    notes: sale.notes,
  }));

  const serializedAdjustments = adjustments.map(a => ({
    id: a.id,
    desc: a.desc,
    kind: a.kind,
    amount: a.amount,
    date: a.date,
    notes: a.notes,
  }));

  return (
    <ReportsClient
      sessions={serializedSessions}
      expenses={serializedExpenses}
      inventory={inventory}
      soldItems={serializedSoldItems}
      adjustments={serializedAdjustments}
    />
  );
}
