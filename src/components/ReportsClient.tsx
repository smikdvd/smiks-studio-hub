"use client";

import { useRef, useEffect, useState, useMemo } from "react";

interface Session {
  id: number;
  client: string;
  netRevenue: number;
  payStatus: string;
  type: string;
  date: string | null;
}
interface Expense {
  id: number;
  desc: string;
  amount: number;
  category: string;
  date: string | null;
  vendor: string | null;
  payMethod: string;
}
interface InventoryItem {
  priceBought: number;
  priceSold: number;
  status: string;
  qty: number;
}
interface SoldItem {
  saleId: string;
  itemId: string;
  name: string;
  brand: string | null;
  category: string;
  priceBought: number;
  priceSold: number;
  dateSold: string | null;
  qty: number;
  notes: string | null;
}
interface Adjustment {
  id: number;
  desc: string;
  kind: string;
  amount: number;
  date: string | null;
  notes: string | null;
}

function fmtMoney(v: number) {
  return "USh " + Math.round(v).toLocaleString("en-US");
}
function fmtMoneyShort(v: number) {
  if (Math.abs(v) >= 1_000_000) return "USh " + (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return "USh " + (v / 1_000).toFixed(0) + "K";
  return "USh " + Math.round(v).toLocaleString();
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const EXPENSE_CATS = [
  "Rent", "Utilities", "Software/Subscriptions", "Equipment Purchase", "Marketing",
  "Staff/Freelance", "Transport", "Maintenance", "Insurance", "Taxes", "Miscellaneous",
];
const SESSION_TYPES = [
  "Recording Session", "Podcast Recording", "Livestream", "Mixing", "Mastering",
  "Consultation", "Rehearsal",
];
const PAY_STATUSES = ["Paid", "Pending", "Partial", "Unpaid"];
const PAY_METHODS = ["Cash", "Mobile Money", "Bank Transfer", "Card", "Other"];
const INV_CATS = [
  "Recording", "Podcast", "Livestreaming", "Mixing & Mastering",
  "Accessories", "Cables & Connectors", "Other",
];

const EXPENSE_CAT_COLORS: Record<string, string> = {
  "Rent": "#f87171", "Utilities": "#fb923c", "Software/Subscriptions": "#a78bfa",
  "Equipment Purchase": "#60a5fa", "Marketing": "#34d399", "Staff/Freelance": "#e8c070",
  "Transport": "#38bdf8", "Maintenance": "#94a3b8", "Insurance": "#c084fc",
  "Taxes": "#f43f5e", "Miscellaneous": "#64748b",
};
const SESSION_TYPE_COLORS: Record<string, string> = {
  "Recording Session": "#60a5fa", "Podcast Recording": "#a78bfa", "Livestream": "#fb923c",
  "Mixing": "#34d399", "Mastering": "#e8c070", "Consultation": "#38bdf8", "Rehearsal": "#94a3b8",
};
const CAT_COLORS: Record<string, string> = {
  "Recording": "#60a5fa", "Podcast": "#a78bfa", "Livestreaming": "#fb923c",
  "Mixing & Mastering": "#34d399", "Accessories": "#e8c070",
  "Cables & Connectors": "#38bdf8", "Other": "#94a3b8",
};

function TH({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", background: "var(--navy-800)", whiteSpace: "nowrap" }}>{children}</th>;
}
function TD({ children, mono, color, right }: { children: React.ReactNode; mono?: boolean; color?: string; right?: boolean }) {
  return <td style={{ padding: "9px 12px", fontFamily: mono ? "'JetBrains Mono',monospace" : undefined, color: color || "var(--text-2)", textAlign: right ? "right" : "left", fontSize: "0.8rem", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{children}</td>;
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

/** Any editable record currently open in the modal. */
type EditKind = "sale" | "expense" | "session" | "adjustment";
type EditState = { kind: EditKind; isNew?: boolean; form: Record<string, string> } | null;

export default function ReportsClient({
  sessions: initialSessions,
  expenses: initialExpenses,
  inventory,
  soldItems: initialSold,
  adjustments: initialAdjustments,
}: {
  sessions: Session[];
  expenses: Expense[];
  inventory: InventoryItem[];
  soldItems: SoldItem[];
  adjustments: Adjustment[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [period, setPeriod] = useState<"12m" | "6m" | "3m">("12m");

  const [sessions, setSessions] = useState(initialSessions);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [soldItems, setSoldItems] = useState(initialSold);
  const [adjustments, setAdjustments] = useState(initialAdjustments);

  const [edit, setEdit] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setToastOn(true);
    setTimeout(() => setToastOn(false), 2400);
  }

  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEdit(prev => (prev ? { ...prev, form: { ...prev.form, [key]: e.target.value } } : prev));

  // ── Open editors ──
  function editSale(si: SoldItem) {
    setEditErr("");
    setEdit({
      kind: "sale",
      form: {
        saleId: si.saleId, itemId: si.itemId, name: si.name,
        brand: si.brand || "", category: si.category,
        qty: String(si.qty), priceSold: String(si.priceSold),
        priceBought: String(si.priceBought), dateSold: si.dateSold || "",
        notes: si.notes || "",
      },
    });
  }
  function editExpense(ex: Expense) {
    setEditErr("");
    setEdit({
      kind: "expense",
      form: {
        id: String(ex.id), desc: ex.desc, category: ex.category,
        amount: String(ex.amount), date: ex.date || "",
        vendor: ex.vendor || "", payMethod: ex.payMethod,
      },
    });
  }
  function editSession(s: Session) {
    setEditErr("");
    setEdit({
      kind: "session",
      form: {
        id: String(s.id), client: s.client, type: s.type,
        netRevenue: String(s.netRevenue), payStatus: s.payStatus, date: s.date || "",
      },
    });
  }
  function editAdjustment(a: Adjustment) {
    setEditErr("");
    setEdit({
      kind: "adjustment",
      form: {
        id: String(a.id), desc: a.desc, kind: a.kind,
        amount: String(a.amount), date: a.date || "", notes: a.notes || "",
      },
    });
  }
  function newAdjustment() {
    setEditErr("");
    setEdit({
      kind: "adjustment", isNew: true,
      form: {
        id: "", desc: "", kind: "Income", amount: "",
        date: new Date().toISOString().split("T")[0], notes: "",
      },
    });
  }

  // ── Save ──
  async function save() {
    if (!edit) return;
    const f = edit.form;
    setSaving(true);
    setEditErr("");
    try {
      if (edit.kind === "sale") {
        const qty = parseInt(f.qty) || 0;
        const price = parseFloat(f.priceSold) || 0;
        if (qty < 1) throw new Error("Quantity must be at least 1");
        const res = await fetch(`/api/inventory/${f.itemId}/sales/${f.saleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qtySold: qty, priceSold: price, dateSold: f.dateSold || null, notes: f.notes || null }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to save sale");

        // Cost lives on the parent item, so it needs its own request
        const cost = parseFloat(f.priceBought) || 0;
        await fetch(`/api/inventory/${f.itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: f.name, brand: f.brand || null, category: f.category, priceBought: cost }),
        });

        setSoldItems(prev => prev.map(si =>
          si.saleId === f.saleId
            ? { ...si, name: f.name, brand: f.brand || null, category: f.category, qty, priceSold: price, priceBought: cost, dateSold: f.dateSold || null, notes: f.notes || null }
            : si.itemId === f.itemId
              ? { ...si, name: f.name, brand: f.brand || null, category: f.category, priceBought: cost }
              : si
        ));
        showToast("Sale updated");

      } else if (edit.kind === "expense") {
        const payload = {
          desc: f.desc, category: f.category,
          amount: parseFloat(f.amount) || 0, date: f.date || null,
          vendor: f.vendor || null, payMethod: f.payMethod,
        };
        const res = await fetch(`/api/expenses/${f.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to save expense");
        setExpenses(prev => prev.map(e => e.id === Number(f.id) ? { ...e, ...payload } : e));
        showToast("Expense updated");

      } else if (edit.kind === "session") {
        const payload = {
          client: f.client, type: f.type,
          netRevenue: parseFloat(f.netRevenue) || 0,
          payStatus: f.payStatus, date: f.date || null,
        };
        const res = await fetch(`/api/sessions/${f.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to save session");
        setSessions(prev => prev.map(s => s.id === Number(f.id) ? { ...s, ...payload } : s));
        showToast("Session updated");

      } else {
        const payload = {
          desc: f.desc, kind: f.kind,
          amount: parseFloat(f.amount) || 0,
          date: f.date || null, notes: f.notes || null,
        };
        if (!payload.desc.trim()) throw new Error("Description is required");
        if (edit.isNew) {
          const res = await fetch("/api/adjustments", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Failed to add adjustment");
          const created: Adjustment = await res.json();
          setAdjustments(prev => [...prev, created]);
          showToast("Adjustment added");
        } else {
          const res = await fetch(`/api/adjustments/${f.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Failed to save adjustment");
          setAdjustments(prev => prev.map(a => a.id === Number(f.id) ? { ...a, ...payload } : a));
          showToast("Adjustment updated");
        }
      }
      setEdit(null);
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Something went wrong");
    }
    setSaving(false);
  }

  async function removeAdjustment() {
    if (!edit || edit.kind !== "adjustment" || edit.isNew) return;
    if (!confirm("Delete this adjustment?")) return;
    await fetch(`/api/adjustments/${edit.form.id}`, { method: "DELETE" });
    setAdjustments(prev => prev.filter(a => a.id !== Number(edit.form.id)));
    setEdit(null);
    showToast("Adjustment deleted");
  }

  // ── Revenue sources ──
  const sessionRevenue = sessions.filter(s => s.payStatus === "Paid").reduce((a, s) => a + s.netRevenue, 0);
  const pendingRevenue = sessions.filter(s => s.payStatus === "Pending" || s.payStatus === "Partial").reduce((a, s) => a + s.netRevenue, 0);
  const inventorySalesRevenue = soldItems.reduce((a, i) => a + i.priceSold * i.qty, 0);
  const inventorySalesCost = soldItems.reduce((a, i) => a + i.priceBought * i.qty, 0);
  const inventoryGrossProfit = inventorySalesRevenue - inventorySalesCost;

  const adjIncome = adjustments.filter(a => a.kind === "Income").reduce((a, x) => a + x.amount, 0);
  const adjExpense = adjustments.filter(a => a.kind === "Expense").reduce((a, x) => a + x.amount, 0);

  const totalRevenue = sessionRevenue + inventorySalesRevenue + adjIncome;
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0) + adjExpense;
  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const inventoryStockValue = inventory.filter(i => i.status === "In Stock").reduce((a, i) => a + i.priceBought * i.qty, 0);

  // ── Monthly buckets ──
  const months = useMemo(() => {
    const monthCount = period === "12m" ? 12 : period === "6m" ? 6 : 3;
    const now = new Date();
    const out: {
      label: string; yr: number; mo: number;
      sessionRev: number; inventoryRev: number; revenue: number;
      expenses: number; net: number;
    }[] = [];
    const inMonth = (d: string | null, yr: number, mo: number) =>
      !!d && new Date(d).getFullYear() === yr && new Date(d).getMonth() === mo;

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const sessionRev = sessions
        .filter(s => s.payStatus === "Paid" && inMonth(s.date, yr, mo))
        .reduce((a, s) => a + s.netRevenue, 0);
      const inventoryRev = soldItems
        .filter(si => inMonth(si.dateSold, yr, mo))
        .reduce((a, si) => a + si.priceSold * si.qty, 0);
      const adjIn = adjustments
        .filter(a => a.kind === "Income" && inMonth(a.date, yr, mo))
        .reduce((a, x) => a + x.amount, 0);
      const adjOut = adjustments
        .filter(a => a.kind === "Expense" && inMonth(a.date, yr, mo))
        .reduce((a, x) => a + x.amount, 0);
      const exp = expenses
        .filter(e => inMonth(e.date, yr, mo))
        .reduce((a, e) => a + e.amount, 0) + adjOut;
      const revenue = sessionRev + inventoryRev + adjIn;
      out.push({ label, yr, mo, sessionRev, inventoryRev, revenue, expenses: exp, net: revenue - exp });
    }
    return out;
  }, [period, sessions, soldItems, expenses, adjustments]);

  // ── Breakdowns ──
  const revenueTypes = useMemo(() => {
    const by: Record<string, number> = {};
    sessions.filter(s => s.payStatus === "Paid").forEach(s => { by[s.type] = (by[s.type] || 0) + s.netRevenue; });
    return Object.entries(by).sort((a, b) => b[1] - a[1]);
  }, [sessions]);
  const maxRevType = Math.max(...revenueTypes.map(r => r[1]), 1);

  const expCats = useMemo(() => {
    const by: Record<string, number> = {};
    expenses.forEach(e => { by[e.category] = (by[e.category] || 0) + e.amount; });
    return Object.entries(by).sort((a, b) => b[1] - a[1]);
  }, [expenses]);
  const maxExpCat = Math.max(...expCats.map(e => e[1]), 1);

  const byDateDesc = <T,>(arr: T[], key: (t: T) => string | null) =>
    [...arr].sort((a, b) => {
      const da = key(a), db = key(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return new Date(db).getTime() - new Date(da).getTime();
    });

  const soldSorted = useMemo(() => byDateDesc(soldItems, si => si.dateSold), [soldItems]);
  const expensesSorted = useMemo(() => byDateDesc(expenses, e => e.date), [expenses]);
  const sessionsSorted = useMemo(() => byDateDesc(sessions, s => s.date), [sessions]);
  const adjSorted = useMemo(() => byDateDesc(adjustments, a => a.date), [adjustments]);

  // ── Canvas bar chart ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.parentElement?.clientWidth || 600;
    const H = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const padL = 10, padR = 10, padT = 10, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const maxVal = Math.max(...months.map(m => Math.max(m.revenue, m.expenses)), 1);
    const groupW = chartW / months.length;
    const barW = Math.min((groupW - 10) / 3, 20);
    const gap = 2;

    ctx.strokeStyle = "rgba(245,234,214,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (i / 4) * chartH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }

    months.forEach((m, i) => {
      const cx = padL + i * groupW + groupW / 2;
      const sessionH = (m.sessionRev / maxVal) * chartH;
      const invH = (m.inventoryRev / maxVal) * chartH;
      const expH = (m.expenses / maxVal) * chartH;

      const sx = cx - barW - gap - barW / 2;
      if (sessionH > 0) {
        ctx.fillStyle = "#34d399";
        ctx.beginPath(); ctx.roundRect(sx, padT + chartH - sessionH, barW, sessionH, [3, 3, 0, 0]); ctx.fill();
      }
      const ix = cx - barW / 2;
      if (invH > 0) {
        ctx.fillStyle = "#d4a843";
        ctx.beginPath(); ctx.roundRect(ix, padT + chartH - invH, barW, invH, [3, 3, 0, 0]); ctx.fill();
      }
      const ex = cx + barW / 2 + gap;
      if (expH > 0) {
        ctx.fillStyle = "#f87171";
        ctx.beginPath(); ctx.roundRect(ex, padT + chartH - expH, barW, expH, [3, 3, 0, 0]); ctx.fill();
      }

      ctx.fillStyle = "rgba(245,234,214,0.4)";
      ctx.font = `600 9px Montserrat, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(m.label.split(" ")[0], cx, padT + chartH + 6);
    });
  }, [months]);

  const profitColor = netProfit >= 0 ? "#34d399" : "#f87171";
  const rowHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => (e.currentTarget.style.background = "var(--surface-2)"),
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => (e.currentTarget.style.background = ""),
    style: { cursor: "pointer" } as React.CSSProperties,
  };

  const modalTitle =
    edit?.kind === "sale" ? "Edit Sale"
    : edit?.kind === "expense" ? "Edit Expense"
    : edit?.kind === "session" ? "Edit Session"
    : edit?.isNew ? "Add Adjustment" : "Edit Adjustment";

  return (
    <div>
      {/* Print header */}
      <div className="print-header" style={{ display: "none" }}>
        <div>
          <div className="print-header-title">🎙️ Smiks&apos; Studio Hub — P&amp;L Report</div>
          <div className="print-header-sub">Printed {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
        </div>
        <div className="print-header-logo">crm-eight-virid.vercel.app</div>
      </div>

      {/* Header */}
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>P&amp;L Report</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Click any row to edit · Sessions + Inventory + Adjustments vs Expenses</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["3m", "6m", "12m"] as const).map(p => (
              <button key={p} className={`filter-btn ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
                {p === "12m" ? "12 Months" : p === "6m" ? "6 Months" : "3 Months"}
              </button>
            ))}
          </div>
          <button className="add-btn" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="g5" style={{ marginBottom: "1.5rem" }}>
        <div className="kpi-card accent2">
          <div className="kpi-label">Session Revenue</div>
          <div className="kpi-value" style={{ fontSize: "1.2rem" }}>{fmtMoney(sessionRevenue)}</div>
          <div className="kpi-sub">Paid bookings</div>
        </div>
        <div className="kpi-card accent1">
          <div className="kpi-label">Inventory Sales</div>
          <div className="kpi-value" style={{ fontSize: "1.2rem" }}>{fmtMoney(inventorySalesRevenue)}</div>
          <div className="kpi-sub">{soldItems.length} item{soldItems.length !== 1 ? "s" : ""} sold</div>
        </div>
        <div className="kpi-card accent3">
          <div className="kpi-label">Total Expenses</div>
          <div className="kpi-value" style={{ fontSize: "1.2rem" }}>{fmtMoney(totalExpenses)}</div>
          <div className="kpi-sub">{adjExpense > 0 ? `Incl. ${fmtMoneyShort(adjExpense)} adjustments` : "All categories"}</div>
        </div>
        <div className={`kpi-card ${netProfit >= 0 ? "accent2" : "accent3"}`}>
          <div className="kpi-label">Net Profit / Loss</div>
          <div className="kpi-value" style={{ fontSize: "1.2rem", color: profitColor }}>{netProfit >= 0 ? "+" : ""}{fmtMoney(netProfit)}</div>
          <div className="kpi-sub">All revenue − expenses</div>
        </div>
        <div className="kpi-card accent4">
          <div className="kpi-label">Stock Value</div>
          <div className="kpi-value" style={{ fontSize: "1.2rem" }}>{fmtMoney(inventoryStockValue)}</div>
          <div className="kpi-sub">In-stock at cost</div>
        </div>
      </div>

      {/* Margin + gross profit */}
      <div className="g2" style={{ marginBottom: "1rem" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.9rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", flexShrink: 0 }}>Profit Margin</div>
          <div style={{ flex: 1, height: 8, background: "rgba(245,234,214,0.07)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, margin))}%`, background: margin >= 0 ? "linear-gradient(90deg,#34d399,#6ee7b7)" : "linear-gradient(90deg,#f87171,#fca5a5)", borderRadius: 4 }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: profitColor, minWidth: 55, textAlign: "right" }}>{margin.toFixed(1)}%</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.9rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Inventory Gross Profit</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: "1.1rem", color: inventoryGrossProfit >= 0 ? "#34d399" : "#f87171" }}>
              {inventoryGrossProfit >= 0 ? "+" : ""}{fmtMoney(inventoryGrossProfit)}
            </div>
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Cost</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82rem", color: "#f87171" }}>{fmtMoney(inventorySalesCost)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pending</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82rem", color: "#fb923c" }}>{fmtMoney(pendingRevenue)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="chart-card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div className="chart-title" style={{ marginBottom: 0 }}>Monthly Revenue vs Expenses</div>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.68rem", fontWeight: 600, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#34d399", display: "inline-block" }} />Sessions</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#d4a843", display: "inline-block" }} />Inventory Sales</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#f87171", display: "inline-block" }} />Expenses</span>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ width: "100%", display: "block" }} />

        <div className="table-scroll" style={{ marginTop: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <thead>
              <tr><TH>Month</TH><TH>Sessions</TH><TH>Inv. Sales</TH><TH>Total Revenue</TH><TH>Expenses</TH><TH>Net P/L</TH></tr>
            </thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={i}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <TD><span style={{ fontWeight: 600, color: "var(--cream)" }}>{m.label}</span></TD>
                  <TD mono color="#34d399">{m.sessionRev > 0 ? fmtMoneyShort(m.sessionRev) : "—"}</TD>
                  <TD mono color="#d4a843">{m.inventoryRev > 0 ? fmtMoneyShort(m.inventoryRev) : "—"}</TD>
                  <TD mono color="var(--cream)">{m.revenue > 0 ? fmtMoneyShort(m.revenue) : "—"}</TD>
                  <TD mono color="#f87171">{m.expenses > 0 ? fmtMoneyShort(m.expenses) : "—"}</TD>
                  <TD mono color={m.net >= 0 ? "#34d399" : "#f87171"}>
                    {m.revenue === 0 && m.expenses === 0 ? "—" : (m.net >= 0 ? "+" : "") + fmtMoneyShort(m.net)}
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory sales */}
      <div className="chart-card" style={{ marginBottom: "1rem" }}>
        <div className="chart-title">Inventory Items Sold</div>
        {soldSorted.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "1rem 0" }}>No inventory items sold yet</div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr><TH>Date Sold</TH><TH>Item</TH><TH>Category</TH><TH>Qty</TH><TH>Cost Each</TH><TH>Sale Price</TH><TH>Total Cost</TH><TH>Revenue</TH><TH>Profit</TH><TH>Margin</TH></tr>
              </thead>
              <tbody>
                {soldSorted.map(si => {
                  const cost = si.priceBought * si.qty;
                  const rev = si.priceSold * si.qty;
                  const profit = rev - cost;
                  const mg = cost > 0 ? (profit / cost) * 100 : 0;
                  const pc = profit >= 0 ? "#34d399" : "#f87171";
                  const catColor = CAT_COLORS[si.category] || "#94a3b8";
                  return (
                    <tr key={si.saleId} {...rowHover} onClick={() => editSale(si)}>
                      <TD mono color="#e8c070">{fmtDate(si.dateSold)}</TD>
                      <TD>
                        <div style={{ fontWeight: 700, color: "var(--cream)", fontSize: "0.8rem" }}>{si.name}</div>
                        {si.brand && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{si.brand}</div>}
                      </TD>
                      <TD><span className="chip" style={{ background: catColor + "18", color: catColor, borderColor: catColor + "40" }}>{si.category}</span></TD>
                      <TD mono>{si.qty}</TD>
                      <TD mono color="var(--text-2)">{fmtMoney(si.priceBought)}</TD>
                      <TD mono color="var(--text-2)">{fmtMoney(si.priceSold)}</TD>
                      <TD mono color="#f87171">{fmtMoney(cost)}</TD>
                      <TD mono color="#34d399">{fmtMoney(rev)}</TD>
                      <TD mono color={pc}>{profit >= 0 ? "+" : ""}{fmtMoney(profit)}</TD>
                      <TD mono color={pc}>{mg.toFixed(1)}%</TD>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--navy-800)", borderTop: "2px solid var(--border-strong)" }}>
                  <td colSpan={6} style={{ padding: "10px 12px", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)" }}>Totals</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#f87171", fontSize: "0.82rem" }}>{fmtMoney(inventorySalesCost)}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#34d399", fontSize: "0.82rem" }}>{fmtMoney(inventorySalesRevenue)}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: inventoryGrossProfit >= 0 ? "#34d399" : "#f87171", fontSize: "0.82rem" }}>
                    {inventoryGrossProfit >= 0 ? "+" : ""}{fmtMoney(inventoryGrossProfit)}
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: inventoryGrossProfit >= 0 ? "#34d399" : "#f87171", fontSize: "0.82rem" }}>
                    {inventorySalesCost > 0 ? ((inventoryGrossProfit / inventorySalesCost) * 100).toFixed(1) + "%" : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="chart-card" style={{ marginBottom: "1rem" }}>
        <div className="chart-title">Studio Sessions</div>
        {sessionsSorted.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "1rem 0" }}>No sessions recorded yet</div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr><TH>Date</TH><TH>Client</TH><TH>Type</TH><TH>Status</TH><TH>Revenue</TH></tr>
              </thead>
              <tbody>
                {sessionsSorted.map(s => {
                  const tc = SESSION_TYPE_COLORS[s.type] || "#94a3b8";
                  const sc = s.payStatus === "Paid" ? "#34d399" : s.payStatus === "Partial" ? "#e8c070" : "#fb923c";
                  return (
                    <tr key={s.id} {...rowHover} onClick={() => editSession(s)}>
                      <TD mono color="#e8c070">{fmtDate(s.date)}</TD>
                      <TD><span style={{ fontWeight: 700, color: "var(--cream)", fontSize: "0.8rem" }}>{s.client}</span></TD>
                      <TD><span className="chip" style={{ background: tc + "18", color: tc, borderColor: tc + "40" }}>{s.type}</span></TD>
                      <TD><span className="chip" style={{ background: sc + "18", color: sc, borderColor: sc + "40" }}>{s.payStatus}</span></TD>
                      <TD mono color={s.payStatus === "Paid" ? "#34d399" : "var(--text-2)"}>{fmtMoney(s.netRevenue)}</TD>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--navy-800)", borderTop: "2px solid var(--border-strong)" }}>
                  <td colSpan={4} style={{ padding: "10px 12px", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)" }}>Paid Total</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#34d399", fontSize: "0.82rem" }}>{fmtMoney(sessionRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Expenses */}
      <div className="chart-card" style={{ marginBottom: "1rem" }}>
        <div className="chart-title">Expense Entries</div>
        {expensesSorted.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "1rem 0" }}>No expenses recorded yet</div>
        ) : (
          <div className="table-scroll" style={{ maxHeight: 420, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr><TH>Date</TH><TH>Description</TH><TH>Category</TH><TH>Vendor</TH><TH>Method</TH><TH>Amount</TH></tr>
              </thead>
              <tbody>
                {expensesSorted.map(e => {
                  const c = EXPENSE_CAT_COLORS[e.category] || "#94a3b8";
                  return (
                    <tr key={e.id} {...rowHover} onClick={() => editExpense(e)}>
                      <TD mono color="#e8c070">{fmtDate(e.date)}</TD>
                      <TD><span style={{ fontWeight: 700, color: "var(--cream)", fontSize: "0.8rem" }}>{e.desc}</span></TD>
                      <TD><span className="chip" style={{ background: c + "18", color: c, borderColor: c + "40" }}>{e.category}</span></TD>
                      <TD>{e.vendor || "—"}</TD>
                      <TD>{e.payMethod}</TD>
                      <TD mono color="#f87171">{fmtMoney(e.amount)}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual adjustments */}
      <div className="chart-card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div className="chart-title" style={{ marginBottom: 0 }}>Manual Adjustments</div>
          <button className="add-btn no-print" onClick={newAdjustment} style={{ padding: "6px 14px", fontSize: "0.7rem" }}>+ Add Adjustment</button>
        </div>
        {adjSorted.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "0.5rem 0" }}>
            No adjustments. Use these for income or costs that live outside sessions, inventory, and expenses.
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr><TH>Date</TH><TH>Description</TH><TH>Type</TH><TH>Notes</TH><TH>Amount</TH></tr>
              </thead>
              <tbody>
                {adjSorted.map(a => {
                  const income = a.kind === "Income";
                  const c = income ? "#34d399" : "#f87171";
                  return (
                    <tr key={a.id} {...rowHover} onClick={() => editAdjustment(a)}>
                      <TD mono color="#e8c070">{fmtDate(a.date)}</TD>
                      <TD><span style={{ fontWeight: 700, color: "var(--cream)", fontSize: "0.8rem" }}>{a.desc}</span></TD>
                      <TD><span className="chip" style={{ background: c + "18", color: c, borderColor: c + "40" }}>{a.kind}</span></TD>
                      <TD>{a.notes || "—"}</TD>
                      <TD mono color={c}>{income ? "+" : "−"}{fmtMoney(a.amount)}</TD>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--navy-800)", borderTop: "2px solid var(--border-strong)" }}>
                  <td colSpan={4} style={{ padding: "10px 12px", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)" }}>Net Adjustment</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: "0.82rem", color: adjIncome - adjExpense >= 0 ? "#34d399" : "#f87171" }}>
                    {adjIncome - adjExpense >= 0 ? "+" : ""}{fmtMoney(adjIncome - adjExpense)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Breakdowns */}
      <div className="chart-grid g2">
        <div className="chart-card">
          <div className="chart-title">Session Revenue by Type</div>
          {revenueTypes.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "1rem 0" }}>No paid sessions yet</div>
          ) : (
            <div className="cat-bar-wrap">
              {revenueTypes.map(([type, amt]) => {
                const c = SESSION_TYPE_COLORS[type] || "#94a3b8";
                return (
                  <div key={type} className="cat-row">
                    <div className="cat-name" style={{ color: c, width: 160 }}>{type}</div>
                    <div className="cat-bar-bg"><div className="cat-bar-fill" style={{ width: `${(amt / maxRevType) * 100}%`, background: c }} /></div>
                    <div className="cat-count" style={{ width: 90, textAlign: "right" }}>{fmtMoneyShort(amt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-title">Expenses by Category</div>
          {expCats.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "1rem 0" }}>No expenses yet</div>
          ) : (
            <div className="cat-bar-wrap">
              {expCats.map(([cat, amt]) => {
                const c = EXPENSE_CAT_COLORS[cat] || "#94a3b8";
                const pct = totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : "0";
                return (
                  <div key={cat} className="cat-row">
                    <div className="cat-name" style={{ color: c, width: 160 }}>{cat}</div>
                    <div className="cat-bar-bg"><div className="cat-bar-fill" style={{ width: `${(amt / maxExpCat) * 100}%`, background: c }} /></div>
                    <div className="cat-count" style={{ width: 110, textAlign: "right" }}>
                      <span style={{ color: "var(--text-muted)", marginRight: 4 }}>{pct}%</span>
                      {fmtMoneyShort(amt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit modal ── */}
      {edit && (
        <div className="modal-overlay no-print">
          <div className="modal" style={{ maxWidth: 560 }}>
            <div style={{ padding: "1.4rem 1.5rem 1.1rem", borderBottom: "1px solid var(--border-strong)", background: "var(--navy-900)", borderRadius: "16px 16px 0 0" }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                {modalTitle}
              </div>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "65vh", overflowY: "auto" }}>
              {edit.kind === "sale" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                    <Field label="Item Name"><input className="input" value={edit.form.name} onChange={setF("name")} /></Field>
                    <Field label="Brand / Model"><input className="input" value={edit.form.brand} onChange={setF("brand")} /></Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.9rem" }}>
                    <Field label="Category">
                      <select className="input" value={edit.form.category} onChange={setF("category")}>
                        {INV_CATS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Date Sold"><input className="input" type="date" value={edit.form.dateSold} onChange={setF("dateSold")} /></Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.9rem" }}>
                    <Field label="Qty Sold"><input className="input" type="number" min="1" value={edit.form.qty} onChange={setF("qty")} /></Field>
                    <Field label="Cost / unit"><input className="input" type="number" step="1" value={edit.form.priceBought} onChange={setF("priceBought")} placeholder="0" /></Field>
                    <Field label="Sale Price / unit"><input className="input" type="number" step="1" value={edit.form.priceSold} onChange={setF("priceSold")} placeholder="0" /></Field>
                  </div>
                  <Field label="Sale Notes">
                    <textarea className="input" rows={2} value={edit.form.notes} onChange={setF("notes")} style={{ resize: "vertical", minHeight: 56 }} />
                  </Field>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Item name, brand, category and cost are shared with the inventory record and update everywhere.
                  </div>
                </>
              )}

              {edit.kind === "expense" && (
                <>
                  <Field label="Description"><input className="input" value={edit.form.desc} onChange={setF("desc")} /></Field>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.9rem" }}>
                    <Field label="Category">
                      <select className="input" value={edit.form.category} onChange={setF("category")}>
                        {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Amount"><input className="input" type="number" step="1" value={edit.form.amount} onChange={setF("amount")} /></Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.9rem" }}>
                    <Field label="Date"><input className="input" type="date" value={edit.form.date} onChange={setF("date")} /></Field>
                    <Field label="Payment Method">
                      <select className="input" value={edit.form.payMethod} onChange={setF("payMethod")}>
                        {PAY_METHODS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Vendor"><input className="input" value={edit.form.vendor} onChange={setF("vendor")} placeholder="Optional" /></Field>
                </>
              )}

              {edit.kind === "session" && (
                <>
                  <Field label="Client"><input className="input" value={edit.form.client} onChange={setF("client")} /></Field>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.9rem" }}>
                    <Field label="Session Type">
                      <select className="input" value={edit.form.type} onChange={setF("type")}>
                        {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Payment Status">
                      <select className="input" value={edit.form.payStatus} onChange={setF("payStatus")}>
                        {PAY_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.9rem" }}>
                    <Field label="Date"><input className="input" type="date" value={edit.form.date} onChange={setF("date")} /></Field>
                    <Field label="Net Revenue"><input className="input" type="number" step="1" value={edit.form.netRevenue} onChange={setF("netRevenue")} /></Field>
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Only sessions marked <strong>Paid</strong> count toward revenue in this report.
                  </div>
                </>
              )}

              {edit.kind === "adjustment" && (
                <>
                  <Field label="Description"><input className="input" value={edit.form.desc} onChange={setF("desc")} placeholder="e.g. Equipment rental income" /></Field>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.9rem" }}>
                    <Field label="Type">
                      <select className="input" value={edit.form.kind} onChange={setF("kind")}>
                        <option>Income</option>
                        <option>Expense</option>
                      </select>
                    </Field>
                    <Field label="Amount"><input className="input" type="number" step="1" value={edit.form.amount} onChange={setF("amount")} placeholder="0" /></Field>
                  </div>
                  <Field label="Date"><input className="input" type="date" value={edit.form.date} onChange={setF("date")} /></Field>
                  <Field label="Notes">
                    <textarea className="input" rows={2} value={edit.form.notes} onChange={setF("notes")} style={{ resize: "vertical", minHeight: 56 }} placeholder="Optional" />
                  </Field>
                </>
              )}

              {editErr && (
                <div style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 8, padding: "9px 13px", fontSize: "0.75rem", color: "#fca5a5", fontWeight: 600 }}>
                  {editErr}
                </div>
              )}
            </div>

            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-strong)", display: "flex", gap: "0.75rem", justifyContent: "flex-end", background: "var(--navy-900)", borderRadius: "0 0 16px 16px" }}>
              {edit.kind === "adjustment" && !edit.isNew && (
                <button className="btn btn-danger" onClick={removeAdjustment} style={{ marginRight: "auto" }}>Delete</button>
              )}
              <button className="btn btn-secondary" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toastOn ? "show" : ""}`}>{toast}</div>
    </div>
  );
}
