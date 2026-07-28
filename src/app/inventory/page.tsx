export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import InventoryClient from "@/components/InventoryClient";

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({
    include: { sales: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = items.map(item => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    sales: item.sales.map(sale => ({
      ...sale,
      createdAt: sale.createdAt.toISOString(),
    })),
  }));

  return <InventoryClient items={serialized} />;
}
