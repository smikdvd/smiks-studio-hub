import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const data = await req.json();
  const { items, ...invoiceData } = data;

  // Auto-generate invoice number
  const count = await prisma.invoice.count();
  const prefix = invoiceData.type === "Receipt" ? "REC" : "INV";
  const number = `${prefix}-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      ...invoiceData,
      number,
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

  return NextResponse.json(invoice, { status: 201 });
}
