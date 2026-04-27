import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.studioSession.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const data = await req.json();
  const session = await prisma.studioSession.create({ data });
  return NextResponse.json(session, { status: 201 });
}
