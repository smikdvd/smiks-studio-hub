import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const adjustments = await prisma.adjustment.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(adjustments);
}

export async function POST(req: Request) {
  const data = await req.json();
  const adjustment = await prisma.adjustment.create({ data });
  return NextResponse.json(adjustment, { status: 201 });
}
