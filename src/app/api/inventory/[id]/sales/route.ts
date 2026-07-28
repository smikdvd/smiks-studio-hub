import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { qtySold, priceSold, dateSold, notes } = await req.json();

  // Validate there's enough stock
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { sales: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const totalSold = item.sales.reduce((s, sale) => s + sale.qtySold, 0);
  const available = item.qty - totalSold;
  if (qtySold > available) {
    return NextResponse.json({ error: `Only ${available} unit(s) available` }, { status: 400 });
  }

  const sale = await prisma.inventoryItemSale.create({
    data: { inventoryItemId: id, qtySold, priceSold, dateSold: dateSold || null, notes: notes || null },
  });

  // Auto-update item status
  const newTotalSold = totalSold + qtySold;
  const newAvailable = item.qty - newTotalSold;
  await prisma.inventoryItem.update({
    where: { id },
    data: { status: newAvailable === 0 ? "Sold" : "In Stock" },
  });

  return NextResponse.json(sale, { status: 201 });
}
