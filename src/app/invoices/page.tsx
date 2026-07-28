export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import InvoicesClient from "@/components/InvoicesClient";

export default async function InvoicesPage() {
  const [invoices, inventory] = await Promise.all([
    prisma.invoice.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventoryItem.findMany({
      where: { status: "In Stock" },
      select: { id: true, name: true, brand: true, category: true, priceSold: true, qty: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <InvoicesClient invoices={invoices} inventory={inventory} />;
}
