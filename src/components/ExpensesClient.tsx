"use client";

import { useState } from "react";

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

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function fmtMoney(v: number) {
  return "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const EMPTY_FORM = { desc: "", category: "Miscellaneous", amount: "", date: "", vendor: "", payMethod: "Cash", notes: "" };

export default function ExpensesClient({ expenses: initial }: { expenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initial);
  const [modal, setModal] = useState<Expense | "new" | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

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
      desc: form.desc.trim(),
      category: form.category,
      amount: parseFloat(form.amount) || 0,
      date: form.date || null,
      vendor: form.vendor.trim() || null,
      payMethod: form.payMethod,
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

  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTotal = expenses.filter(e => e.date && e.date.startsWith(thisMonth)).reduce((a, e) => a + e.amount, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="section-title">Expenses</div>
        <button className="add-btn" onClick={openAdd}>+ Add Expense</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="kpi-card accent3">
          <div className="kpi-label">Total Expenses</div>
          <div className="kpi-value">{fmtMoney(totalExpenses)}</div>
        </div>
        <div className="kpi-card accent1">
          <div className="kpi-label">This Month</div>
          <div className="kpi-value">{fmtMoney(monthTotal)}</div>
        </div>
        <div className="kpi-card accent2">
          <div className="kpi-label">Transactions</div>
          <div className="kpi-value">{expenses.length}</div>
        </div>
      </div>

      {/* Expense List */}
      {expenses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          No expenses recorded. Start tracking your costs!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {expenses.map(e => (
            <div key={e.id} onClick={() => openEdit(e)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.15s", boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={el => { (el.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; (el.currentTarget as HTMLElement).style.background = "var(--gold-muted)"; }}
              onMouseLeave={el => { (el.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (el.currentTarget as HTMLElement).style.background = "var(--surface)"; }}>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--cream)" }}>{e.desc}</div>
                <div style={{ fontSize: "0.67rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, marginTop: 2 }}>
                  {fmtDate(e.date)} · {e.category}{e.vendor ? ` · ${e.vendor}` : ""}
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", fontWeight: 700, color: "#f87171" }}>-{fmtMoney(e.amount)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--navy-900)", borderRadius: "16px 16px 0 0" }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--cream)", textTransform: "uppercase" }}>{modal === "new" ? "Add Expense" : "Edit Expense"}</div>
              <button onClick={() => setModal(null)} style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text-muted)", cursor: "pointer", padding: "6px 10px", borderRadius: 7 }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Description</span>
                  <input className="input" value={form.desc} onChange={f("desc")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Category</span>
                  <select className="input" value={form.category} onChange={f("category")}>
                    {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Amount ($)</span>
                  <input className="input" type="number" step="0.01" value={form.amount} onChange={f("amount")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Date</span>
                  <input className="input" type="date" value={form.date} onChange={f("date")} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Vendor</span>
                  <input className="input" value={form.vendor} onChange={f("vendor")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Payment Method</span>
                  <select className="input" value={form.payMethod} onChange={f("payMethod")}>
                    {PAY_METHODS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <label style={{ display: "block" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Notes</span>
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
