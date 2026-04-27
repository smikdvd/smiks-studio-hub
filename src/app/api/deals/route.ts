import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const deals = await prisma.deal.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(deals);
}

export async function POST(request: Request) {
  const body = await request.json();
  const deal = await prisma.deal.create({
    data: {
      title: body.title,
      value: body.value,
      stage: body.stage || "new",
      customerId: body.customerId,
    },
  });
  return NextResponse.json(deal);
}