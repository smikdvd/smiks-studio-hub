import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(id) },
    include: { items: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const { items, ...invoiceData } = data;

  await prisma.invoiceItem.deleteMany({ where: { invoiceId: parseInt(id) } });

  const invoice = await prisma.invoice.update({
    where: { id: parseInt(id) },
    data: {
      ...invoiceData,
      items: {
        create: items.map((item: { description: string; inventoryItemId?: string; qty: number; unitPrice: number; total: number }) => ({
          description: item.description,
          inventoryItemId: item.inventoryItemId || null,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.invoice.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
