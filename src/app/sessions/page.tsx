export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import SessionsClient from "@/components/SessionsClient";

export default async function SessionsPage() {
  const sessions = await prisma.studioSession.findMany({ orderBy: { createdAt: "desc" } });
  return <SessionsClient sessions={sessions} />;
}
