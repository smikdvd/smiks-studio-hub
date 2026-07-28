"use client";

import { useRef, useEffect } from "react";

interface DashItem {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  qty: number;
  dateBought: string | null;
  priceBought: number;
  priceSold: number;
  status: string;
}

const CAT_COLORS: Record<string, string> = {
  "Recording": "#60a5fa",
  "Podcast": "#a78bfa",
  "Livestreaming": "#fb923c",
  "Mixing & Mastering": "#34d399",
  "Accessories": "#e8c070",
  "Cables & Connectors": "#38bdf8",
  "Other": "#94a3b8",
};

const STATUS_COLORS: Record<string, string> = {
  "In Stock": "#34d399",
  "Sold": "#60a5fa",
  "Reserved": "#38bdf8",
  "Repair": "#fb923c",
  "Cancelled": "#f87171",
  "Returned": "#e8c070",
  "Written Off": "#64748b",
};

const CATEGORIES = ["Recording", "Podcast", "Livestreaming", "Mixing & Mastering", "Accessories", "Cables & Connectors", "Other"];

export default function DashboardClient({ items }: { items: DashItem[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalItems = items.length;
  const totalQty = items.reduce((a, i) => a + i.qty, 0);
  const inStock = items.filter(i => i.status === "In Stock").length;
  const cancelledReturned = items.filter(i => i.status === "Cancelled" || i.status === "Returned").length;

  const catCounts = CATEGORIES.map(cat => ({ cat, count: items.filter(i => i.category === cat).length }));
  const maxCat = Math.max(...catCounts.map(c => c.count), 1);

  const statusCounts = Object.entries(STATUS_COLORS).map(([status, color]) => ({
    status, color, count: items.filter(i => i.status === status).length,
  })).filter(s => s.count > 0);

  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short" });
    const yr = d.getFullYear();
    const mo = d.getMonth();
    const count = items.filter(item => {
      if (!item.dateBought) return false;
      const bd = new Date(item.dateBought);
      return bd.getFullYear() === yr && bd.getMonth() === mo;
    }).length;
    months.push({ label, count });
  }
  const maxMonth = Math.max(...months.map(m => m.count), 1);

  const recent = [...items]
    .sort((a, b) => {
      if (!a.dateBought && !b.dateBought) return 0;
      if (!a.dateBought) return 1;
      if (!b.dateBought) return -1;
      return new Date(b.dateBought).getTime() - new Date(a.dateBought).getTime();
    })
    .slice(0, 5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 160 * dpr;
    canvas.height = 160 * dpr;
    canvas.style.width = "160px";
    canvas.style.height = "160px";
    ctx.scale(dpr, dpr);

    const cx = 80, cy = 80, radius = 65, lineW = 22;
    const total = statusCounts.reduce((a, s) => a + s.count, 0);
    if (total === 0) return;

    let angle = -Math.PI / 2;
    statusCounts.forEach(s => {
      const slice = (s.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, angle, angle + slice);
      ctx.arc(cx, cy, radius - lineW, angle + slice, angle, true);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      angle += slice;
    });

    ctx.fillStyle = "#f5ead6";
    ctx.font = `bold 22px 'JetBrains Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(total), cx, cy - 8);
    ctx.fillStyle = "rgba(245,234,214,0.45)";
    ctx.font = `600 9px Montserrat, sans-serif`;
    ctx.fillText("TOTAL", cx, cy + 10);
  }, [statusCounts]);

  function fmtDate(s: string | null) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  }

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>Dashboard</h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Studio inventory overview</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="kpi-card accent1">
          <div style={{ position: "absolute", right: "1.2rem", top: "1.2rem", width: 38, height: 38, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", background: "rgba(245,234,214,0.06)", border: "1px solid var(--border)" }}>📦</div>
          <div className="kpi-label">Total Items</div>
          <div className="kpi-value">{totalItems}</div>
          <div className="kpi-sub">{totalQty} units total</div>
        </div>
        <div className="kpi-card accent2">
          <div style={{ position: "absolute", right: "1.2rem", top: "1.2rem", width: 38, height: 38, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", background: "rgba(245,234,214,0.06)", border: "1px solid var(--border)" }}>✅</div>
          <div className="kpi-label">In Stock</div>
          <div className="kpi-value">{inStock}</div>
          <div className="kpi-sub">Ready to sell or use</div>
        </div>
        <div className="kpi-card accent3">
          <div style={{ position: "absolute", right: "1.2rem", top: "1.2rem", width: 38, height: 38, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", background: "rgba(245,234,214,0.06)", border: "1px solid var(--border)" }}>↩️</div>
          <div className="kpi-label">Cancelled / Returned</div>
          <div className="kpi-value">{cancelledReturned}</div>
          <div className="kpi-sub">Orders not fulfilled</div>
        </div>
        <div className="kpi-card accent4">
          <div style={{ position: "absolute", right: "1.2rem", top: "1.2rem", width: 38, height: 38, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", background: "rgba(245,234,214,0.06)", border: "1px solid var(--border)" }}>🏷️</div>
          <div className="kpi-label">Categories</div>
          <div className="kpi-value">7</div>
          <div className="kpi-sub">Product types tracked</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="chart-grid g2" style={{ marginBottom: "1rem" }}>
        {/* Category bars */}
        <div className="chart-card">
          <div className="chart-title">Category Distribution</div>
          <div className="cat-bar-wrap">
            {catCounts.map(({ cat, count }) => (
              <div key={cat} className="cat-row">
                <div className="cat-name" style={{ color: CAT_COLORS[cat] }}>{cat}</div>
                <div className="cat-bar-bg">
                  <div className="cat-bar-fill" style={{ width: `${(count / maxCat) * 100}%`, background: CAT_COLORS[cat] }} />
                </div>
                <div className="cat-count">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Status donut */}
        <div className="chart-card">
          <div className="chart-title">Status Breakdown</div>
          <div className="donut-wrap">
            <canvas ref={canvasRef} style={{ flexShrink: 0 }} />
            <div className="donut-legend">
              {statusCounts.map(s => (
                <div key={s.status} className="legend-item">
                  <span className="legend-dot" style={{ background: s.color }} />
                  <span style={{ flex: 1 }}>{s.status}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline + Recent */}
      <div className="chart-grid g2">
        {/* Timeline */}
        <div className="chart-card">
          <div className="chart-title">Monthly Acquisitions (Last 12 Months)</div>
          <div className="timeline-bars">
            {months.map((m, i) => (
              <div key={i} className="t-bar-wrap">
                <div
                  className="t-bar"
                  title={`${m.label}: ${m.count}`}
                  style={{ height: `${Math.max(4, (m.count / maxMonth) * 100)}%` }}
                />
                <div className="t-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Items */}
        <div className="chart-card">
          <div className="chart-title">Recent Acquisitions</div>
          <div>
            {recent.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "1rem 0" }}>No items yet</div>
            ) : recent.map(item => (
              <div key={item.id} className="recent-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--cream)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>{item.category} · {fmtDate(item.dateBought)}</div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", fontWeight: 700, color: CAT_COLORS[item.category] || "#94a3b8", flexShrink: 0 }}>
                  {item.priceBought ? "USh " + Number(item.priceBought).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
