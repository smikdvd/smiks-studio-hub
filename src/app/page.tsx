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
    { href: "/customers",  label: "Customers",      value: customers,      accent: "accent4" },
    { href: "/deals",      label: "Pipeline Value",  value: "$" + totalPipeline.toLocaleString(), accent: "accent1" },
    { href: "/tasks",      label: "Pending Tasks",   value: tasks,          accent: "accent6" },
    { href: "/inventory",  label: "Items In Stock",  value: inStockCount,   accent: "accent2" },
    { href: "/sessions",   label: "Session Revenue", value: "$" + totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), accent: "accent2" },
    { href: "/expenses",   label: "Total Expenses",  value: "$" + totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), accent: "accent3" },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{
          fontSize: "0.65rem", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--gold)", marginBottom: "0.5rem",
        }}>
          Overview
        </div>
        <h1 style={{
          fontSize: "2.2rem", fontWeight: 600,
          color: "var(--text)", letterSpacing: "-0.04em",
          lineHeight: 1.05, margin: 0,
        }}>
          Studio Hub
        </h1>
        <p style={{
          fontSize: "0.875rem", color: "var(--text-muted)",
          marginTop: "0.5rem", fontWeight: 400,
        }}>
          Studio business at a glance
        </p>
      </div>

      {/* KPI grid — hairline-divided panel */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
        background: "var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}>
        {kpis.map(k => (
          <Link key={k.href} href={k.href} style={{ textDecoration: "none" }}>
            <div
              className={`kpi-card ${k.accent}`}
              style={{ borderRadius: 0, border: "none", height: "100%" }}
            >
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              <div style={{
                marginTop: "1rem",
                fontSize: "0.72rem",
                color: "var(--text-subtle)",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                View all →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
