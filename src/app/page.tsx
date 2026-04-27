export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const [customers, deals, tasks, inventoryItems, sessions, expenses] = await Promise.all([
    prisma.customer.count(),
    prisma.deal.findMany({ select: { value: true } }),
    prisma.task.count({ where: { completed: false } }),
    prisma.inventoryItem.findMany({ select: { status: true, priceBought: true } }),
    prisma.studioSession.findMany({ select: { netRevenue: true, payStatus: true } }),
    prisma.expense.findMany({ select: { amount: true } }),
  ]);

  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
  const inStockCount = inventoryItems.filter(i => i.status === "In Stock").length;
  const totalRevenue = sessions.filter(s => s.payStatus === "Paid").reduce((a, s) => a + s.netRevenue, 0);
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);

  const kpis = [
    { href: "/customers", label: "Customers", value: customers, accent: "accent4", icon: "👥" },
    { href: "/deals", label: "Pipeline Value", value: "$" + totalPipeline.toLocaleString(), accent: "accent1", icon: "💼" },
    { href: "/tasks", label: "Pending Tasks", value: tasks, accent: "accent6", icon: "✅" },
    { href: "/inventory", label: "Items In Stock", value: inStockCount, accent: "accent2", icon: "📦" },
    { href: "/sessions", label: "Session Revenue", value: "$" + totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), accent: "accent2", icon: "🎙️" },
    { href: "/expenses", label: "Total Expenses", value: "$" + totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), accent: "accent3", icon: "💸" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>Dashboard</h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Studio business overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {kpis.map(k => (
          <Link key={k.href} href={k.href} style={{ textDecoration: "none" }}>
            <div className={`kpi-card ${k.accent}`} style={{ transition: "all 0.2s", cursor: "pointer" }}>
              <div style={{ position: "absolute", right: "1.2rem", top: "1.2rem", width: 38, height: 38, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", background: "rgba(245,234,214,0.06)", border: "1px solid var(--border)" }}>
                {k.icon}
              </div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
