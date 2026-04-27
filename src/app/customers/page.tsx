export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import CustomersClient from "@/components/CustomersClient";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <CustomersClient customers={customers} />;
}