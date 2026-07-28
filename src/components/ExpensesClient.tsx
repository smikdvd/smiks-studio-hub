"use client";

import { useState, useMemo } from "react";

interface Expense {
  id: number;
  desc: string;
  category: string;
  amount: number;
  date: string | null;
  vendor: string | null;
  payMethod: string;
  notes: string | null;
}

const EXPENSE_CATS = ["Rent", "Utilities", "Software/Subscriptions", "Equipment Purchase", "Marketing", "Staff/Freelance", "Transport", "Maintenance", "Insurance", "Taxes", "Miscellaneous"];
const PAY_METHODS = ["Cash", "Mobile Money", "Bank Transfer", "Credit Card", "Cheque", "Other"];

// A distinct colour for each calendar month (Jan=0 … Dec=11)
const MONTH_COLORS = [
  "#60a5fa", // Jan — blue
  "#a78bfa", // Feb — purple
  "#34d399", // Mar — green
  "#fb923c", // Apr — orange
  "#f472b6", // May — pink
  "#38bdf8", // Jun — cyan
  "#e8c070", // Jul — gold
  "#4ade80", // Aug — lime
  "#f87171", // Sep — red
  "#c084fc", // Oct — violet
  "#fdba74", // Nov — amber
  "#86efac", // Dec — emerald
];

const CAT_COLORS: Record<string, string> = {
  Rent: "#f87171",
  Utilities: "#38bdf8",
  "Software/Subscriptions": "#a78bfa",
  "Equipment Purchase": "#e8c070",
  Marketing: "#f472b6",
  "Staff/Freelance": "#4ade80",
  Transport: "#fb923c",
  Maintenance: "#60a5fa",
  Insurance: "#c084fc",
  Taxes: "#fdba74",
  Miscellaneous: "#94a3b8",
};

function fmtMoney(v: number) {
  return "USh " + Math.round(v).toLocaleString("en-US");
}

function fmtDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}

// Week-of-month bucket: days 1-7 → W1, 8-14 → W2, 15-21 → W3, 22-28 → W4, 29+ → W5
function weekOfMonth(dateStr: string): number {
  const day = new Date(dateStr).getDate();
  return Math.ceil(day / 7);
}

function weekLabel(w: number, monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const starts = (w - 1) * 7 + 1;
  const lastDay = new Date(y, m, 0).getDate(); // last day of month
  const ends = Math.min(w * 7, lastDay);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short" });
  return `Week ${w} · ${monthName} ${starts}–${ends}`;
}

const EMPTY_FORM = { desc: "", category: "Miscellaneous", amount: "", date: "", vendor: "", payMethod: "Cash", notes: "" };

const labelStyle: React.CSSProperties = {
  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6,
};

export default function ExpensesClient({ expenses: initial }: { expenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initial);
  const [modal, setModal] = useState<Expense | "new" | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  // Track which months are open; default current month open
  const nowKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  })();
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({ [nowKey]: true });

  function toggleMonth(key: string) {
    setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function showToast(msg: string) {
    setToast(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  function openAdd() { setForm({ ...EMPTY_FORM }); setModal("new"); }
  function openEdit(e: Expense) {
    setForm({ desc: e.desc, category: e.category, amount: String(e.amount || ""), date: e.date || "", vendor: e.vendor || "", payMethod: e.payMethod, notes: e.notes || "" });
    setModal(e);
  }

  async function save() {
    if (!form.desc.trim()) { showToast("Description is required"); return; }
    const payload = {
      desc: form.desc.trim(), category: form.category,
      amount: parseFloat(form.amount) || 0, date: form.date || null,
      vendor: form.vendor.trim() || null, payMethod: form.payMethod,
      notes: form.notes.trim() || null,
    };
    if (modal === "new") {
      const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const created = await res.json();
      setExpenses(prev => [created, ...prev]);
      showToast("Expense saved!");
    } else if (modal && typeof modal === "object") {
      await fetch(`/api/expenses/${modal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setExpenses(prev => prev.map(e => e.id === modal.id ? { ...e, ...payload } : e));
      showToast("Expense updated!");
    }
    setModal(null);
  }

  async function deleteExpense() {
    if (!modal || modal === "new" || typeof modal !== "object") return;
    if (!confirm("Delete expense?")) return;
    await fetch(`/api/expenses/${modal.id}`, { method: "DELETE" });
    setExpenses(prev => prev.filter(e => e.id !== modal.id));
    setModal(null);
    showToast("Expense deleted");
  }

  const f = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  // ── Grouping logic ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter(e => {
      const matchQ = !q || e.desc.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || (e.vendor || "").toLowerCase().includes(q);
      const matchCat = !catFilter || e.category === catFilter;
      return matchQ && matchCat;
    });
  }, [expenses, search, catFilter]);

  // monthKey → { expenses, weekMap }
  const grouped = useMemo(() => {
    const map: Record<string, { expenses: Expense[]; weeks: Record<number, Expense[]> }> = {};
    const sorted = [...filtered].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date); // newest month first
    });
    for (const e of sorted) {
      const key = e.date ? e.date.slice(0, 7) : "undated";
      if (!map[key]) map[key] = { expenses: [], weeks: {} };
      map[key].expenses.push(e);
      const w = e.date ? weekOfMonth(e.date) : 0;
      if (!map[key].weeks[w]) map[key].weeks[w] = [];
      map[key].weeks[w].push(e);
    }
    return map;
  }, [filtered]);

  const monthKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // KPIs
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonthTotal = (grouped[nowKey]?.expenses || []).reduce((s, e) => s + e.amount, 0);
  const lastMonthKey = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const lastMonthTotal = (grouped[lastMonthKey]?.expenses || []).reduce((s, e) => s + e.amount, 0);

  function monthColor(key: string): string {
    if (key === "undated") return "#94a3b8";
    const month = parseInt(key.split("-")[1]) - 1; // 0-based
    return MONTH_COLORS[month];
  }

  function monthTitle(key: string): string {
    if (key === "undated") return "Undated";
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" }).toUpperCase();
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="section-title">Expenses <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 400 }}>({expenses.length})</span></div>
        <button className="add-btn" onClick={openAdd}>+ Add Expense</button>
      </div>

      {/* KPIs */}
      <div className="g3" style={{ marginBottom: "1.5rem" }}>
        <div className="kpi-card accent3">
          <div className="kpi-label">All Time</div>
          <div className="kpi-value">{fmtMoney(totalExpenses)}</div>
        </div>
        <div className="kpi-card accent1">
          <div className="kpi-label">This Month</div>
          <div className="kpi-value">{fmtMoney(thisMonthTotal)}</div>
        </div>
        <div className="kpi-card accent2">
          <div className="kpi-label">Last Month</div>
          <div className="kpi-value">{fmtMoney(lastMonthTotal)}</div>
        </div>
      </div>

      {/* Search + category filter */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#7070a0" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#7070a0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input placeholder="Search expenses…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-btn" value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ cursor: "pointer", background: "var(--surface)", color: "var(--text-2)" }}>
          <option value="">All Categories</option>
          {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
        </select>
        {/* Expand / collapse all */}
        <button className="filter-btn" onClick={() => {
          const allOpen: Record<string, boolean> = {};
          monthKeys.forEach(k => { allOpen[k] = true; });
          setOpenMonths(allOpen);
        }}>Expand All</button>
        <button className="filter-btn" onClick={() => setOpenMonths({})}>Collapse All</button>
      </div>

      {/* Monthly accordions */}
      {monthKeys.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase" }}>
          No expenses found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {monthKeys.map(monthKey => {
            const { expenses: mExpenses, weeks } = grouped[monthKey];
            const monthTotal = mExpenses.reduce((s, e) => s + e.amount, 0);
            const color = monthColor(monthKey);
            const isOpen = !!openMonths[monthKey];
            const weekNums = Object.keys(weeks).map(Number).sort((a, b) => a - b);
            const isCurrentMonth = monthKey === nowKey;

            return (
              <div key={monthKey} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${color}30`, boxShadow: "var(--shadow-sm)" }}>

                {/* Month header — clickable */}
                <div
                  onClick={() => toggleMonth(monthKey)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 18px", cursor: "pointer",
                    background: `linear-gradient(90deg, ${color}18 0%, var(--navy-800) 100%)`,
                    borderLeft: `4px solid ${color}`,
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 900, color, letterSpacing: "0.06em" }}>
                      {monthTitle(monthKey)}
                    </span>
                    {isCurrentMonth && (
                      <span style={{ fontSize: "0.58rem", fontWeight: 800, background: color + "22", color, border: `1px solid ${color}40`, borderRadius: 4, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Current
                      </span>
                    )}
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      {mExpenses.length} entries
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.92rem", fontWeight: 800, color: "#f87171" }}>
                      -{fmtMoney(monthTotal)}
                    </span>
                    <span style={{ color, fontSize: "0.9rem", transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                  </div>
                </div>

                {/* Weeks inside month */}
                {isOpen && (
                  <div style={{ background: "var(--navy-900)" }}>
                    {weekNums.map(w => {
                      const wExpenses = weeks[w];
                      const weekTotal = wExpenses.reduce((s, e) => s + e.amount, 0);
                      // Group expenses within the week by date
                      const byDate: Record<string, Expense[]> = {};
                      for (const e of wExpenses) {
                        const dk = e.date || "undated";
                        if (!byDate[dk]) byDate[dk] = [];
                        byDate[dk].push(e);
                      }
                      const dateKeys = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

                      return (
                        <div key={w} style={{ borderBottom: `1px solid ${color}18` }}>
                          {/* Week sub-header */}
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "8px 18px 8px 26px",
                            background: `${color}08`,
                            borderLeft: `4px solid ${color}40`,
                          }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: color + "cc", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              {w === 0 ? "Undated" : weekLabel(w, monthKey)}
                            </span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                              -{fmtMoney(weekTotal)}
                            </span>
                          </div>

                          {/* Days within the week */}
                          {dateKeys.map(dk => {
                            const dayExpenses = byDate[dk];
                            const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
                            return (
                              <div key={dk}>
                                {/* Day label */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 18px 3px 36px" }}>
                                  <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                    {dk === "undated" ? "No date" : fmtDayLabel(dk)}
                                  </span>
                                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.63rem", color: "var(--text-muted)" }}>
                                    {fmtMoney(dayTotal)}
                                  </span>
                                </div>
                                {/* Expense rows */}
                                {dayExpenses.map(e => {
                                  const catColor = CAT_COLORS[e.category] || "#94a3b8";
                                  return (
                                    <div
                                      key={e.id}
                                      onClick={() => openEdit(e)}
                                      style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "8px 18px 8px 36px",
                                        cursor: "pointer", transition: "background 0.12s",
                                        borderLeft: `4px solid ${catColor}50`,
                                      }}
                                      onMouseEnter={el => (el.currentTarget as HTMLElement).style.background = `${color}0d`}
                                      onMouseLeave={el => (el.currentTarget as HTMLElement).style.background = ""}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: catColor, flexShrink: 0 }} />
                                        <div style={{ minWidth: 0 }}>
                                          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--cream)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.desc}</div>
                                          <div style={{ fontSize: "0.63rem", color: "var(--text-muted)", marginTop: 1 }}>
                                            <span style={{ color: catColor, fontWeight: 700 }}>{e.category}</span>
                                            {e.vendor ? ` · ${e.vendor}` : ""}
                                            {` · ${e.payMethod}`}
                                          </div>
                                        </div>
                                      </div>
                                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", fontWeight: 700, color: "#f87171", flexShrink: 0, marginLeft: 12 }}>
                                        -{fmtMoney(e.amount)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Month footer total */}
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 18px", borderTop: `1px solid ${color}25`, background: `${color}08` }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 10 }}>Month Total</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", fontWeight: 800, color: "#f87171" }}>-{fmtMoney(monthTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--navy-900)", borderRadius: "16px 16px 0 0" }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--cream)", textTransform: "uppercase" }}>{modal === "new" ? "Add Expense" : "Edit Expense"}</div>
              <button onClick={() => setModal(null)} style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text-muted)", cursor: "pointer", padding: "6px 10px", borderRadius: 7 }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Description</span>
                  <input className="input" value={form.desc} onChange={f("desc")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Category</span>
                  <select className="input" value={form.category} onChange={f("category")}>
                    {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Amount (USh)</span>
                  <input className="input" type="number" step="1" value={form.amount} onChange={f("amount")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Date</span>
                  <input className="input" type="date" value={form.date} onChange={f("date")} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Vendor</span>
                  <input className="input" value={form.vendor} onChange={f("vendor")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Payment Method</span>
                  <select className="input" value={form.payMethod} onChange={f("payMethod")}>
                    {PAY_METHODS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <label style={{ display: "block" }}>
                <span style={labelStyle}>Notes</span>
                <textarea className="input" rows={2} value={form.notes} onChange={f("notes")} style={{ resize: "vertical", minHeight: 60 }} />
              </label>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-strong)", display: "flex", gap: "0.75rem", justifyContent: "flex-end", background: "var(--navy-900)", borderRadius: "0 0 16px 16px" }}>
              {modal !== "new" && (
                <button className="btn btn-danger" onClick={deleteExpense} style={{ marginRight: "auto" }}>Delete</button>
              )}
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toastVisible ? "show" : ""}`}>{toast}</div>
    </div>
  );
}
