export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import TasksClient from "@/components/TasksClient";

export default async function TasksPage() {
  const [tasks, customers] = await Promise.all([
    prisma.task.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedTasks = tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString().split("T")[0] || null,
  }));

  return <TasksClient tasks={serializedTasks} customers={customers} />;
}