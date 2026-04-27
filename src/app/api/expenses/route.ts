import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const expenses = await prisma.expense.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const data = await req.json();
  const expense = await prisma.expense.create({ data });
  return NextResponse.json(expense, { status: 201 });
}
