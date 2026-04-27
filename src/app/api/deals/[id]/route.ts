import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const deal = await prisma.deal.update({
    where: { id: parseInt(id) },
    data: {
      title: body.title,
      value: body.value,
      stage: body.stage,
    },
  });
  return NextResponse.json(deal);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.deal.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}