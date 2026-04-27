import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(id) },
    include: { deals: true, tasks: true },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json(customer);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const customer = await prisma.customer.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      position: body.position,
      status: body.status,
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}