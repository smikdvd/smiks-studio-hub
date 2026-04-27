export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import DealsClient from "@/components/DealsClient";

export default async function DealsPage() {
  const [deals, customers] = await Promise.all([
    prisma.deal.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return <DealsClient deals={deals} customers={customers} />;
}