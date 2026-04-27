import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const session = await prisma.studioSession.update({ where: { id: parseInt(id) }, data });
  return NextResponse.json(session);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.studioSession.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
