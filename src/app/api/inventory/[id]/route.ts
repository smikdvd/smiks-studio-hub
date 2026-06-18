import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data,
    include: { sales: { orderBy: { createdAt: "asc" } } },
  });

  // Recalculate status based on actual stock unless user explicitly set a special status
  const specialStatuses = ["Reserved", "Repair", "In Transit", "Cancelled", "Returned", "Written Off"];
  if (!specialStatuses.includes(updated.status)) {
    const totalSold = updated.sales.reduce((s, sale) => s + sale.qtySold, 0);
    const available = updated.qty - totalSold;
    const correctStatus = available <= 0 ? "Sold" : "In Stock";
    if (correctStatus !== updated.status) {
      return NextResponse.json(
        await prisma.inventoryItem.update({
          where: { id },
          data: { status: correctStatus },
          include: { sales: { orderBy: { createdAt: "asc" } } },
        })
      );
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
