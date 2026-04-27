export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import InventoryClient from "@/components/InventoryClient";

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({ orderBy: { createdAt: "desc" } });
  return <InventoryClient items={items} />;
}
