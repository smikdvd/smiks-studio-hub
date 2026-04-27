export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ExpensesClient from "@/components/ExpensesClient";

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({ orderBy: { createdAt: "desc" } });
  return <ExpensesClient expenses={expenses} />;
}
