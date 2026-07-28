import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.inventoryItem.findMany({
    include: { sales: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const data = await req.json();
  const item = await prisma.inventoryItem.create({
    data,
    include: { sales: true },
  });
  return NextResponse.json(item, { status: 201 });
}
