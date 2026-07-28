import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const adjustment = await prisma.adjustment.update({ where: { id: parseInt(id) }, data });
  return NextResponse.json(adjustment);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.adjustment.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
