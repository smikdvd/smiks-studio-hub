import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Recalculate the parent item's status from its remaining sales
async function syncStatus(itemId: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: { sales: true },
  });
  if (!item) return;
  const special = ["Reserved", "Repair", "In Transit", "Cancelled", "Returned", "Written Off"];
  if (special.includes(item.status)) return;
  const totalSold = item.sales.reduce((s, sale) => s + sale.qtySold, 0);
  const available = item.qty - totalSold;
  const correct = available <= 0 ? "Sold" : "In Stock";
  if (correct !== item.status) {
    await prisma.inventoryItem.update({ where: { id: itemId }, data: { status: correct } });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; saleId: string }> }) {
  const { id, saleId } = await params;
  const { qtySold, priceSold, dateSold, notes } = await req.json();

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { sales: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Available stock excluding the sale being edited
  const otherSold = item.sales
    .filter(s => s.id !== saleId)
    .reduce((s, sale) => s + sale.qtySold, 0);
  if (qtySold > item.qty - otherSold) {
    return NextResponse.json(
      { error: `Only ${item.qty - otherSold} unit(s) available for this sale` },
      { status: 400 }
    );
  }

  const sale = await prisma.inventoryItemSale.update({
    where: { id: saleId },
    data: {
      qtySold,
      priceSold,
      dateSold: dateSold || null,
      notes: notes ?? null,
    },
  });

  await syncStatus(id);
  return NextResponse.json(sale);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; saleId: string }> }) {
  const { id, saleId } = await params;
  await prisma.inventoryItemSale.delete({ where: { id: saleId } });
  await syncStatus(id);
  return NextResponse.json({ ok: true });
}
