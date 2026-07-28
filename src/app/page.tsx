export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export default async function HomePage() {
  const items = await prisma.inventoryItem.findMany({
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      qty: true,
      dateBought: true,
      priceBought: true,
      priceSold: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = items.map(i => ({
    ...i,
    dateBought: i.dateBought ? new Date(i.dateBought).toISOString().split("T")[0] : null,
  }));

  return <DashboardClient items={serialized} />;
}
