"use client";

import { useState, useRef } from "react";

interface InvoiceItem {
  id?: number;
  description: string;
  inventoryItemId?: string | null;
  qty: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: number;
  number: string;
  type: string;
  date: string | null;
  dueDate: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddr: string | null;
  notes: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
}

interface InventoryOption {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  priceSold: number;
  qty: number;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: "#94a3b8",
  Sent: "#60a5fa",
  Paid: "#34d399",
};

function fmtMoney(v: number) {
  return "USh " + Math.round(v).toLocaleString("en-US");
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const EMPTY_FORM = {
  type: "Invoice",
  date: new Date().toISOString().split("T")[0],
  dueDate: "",
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  clientAddr: "",
  notes: "",
  status: "Draft",
  tax: 0,
};

type FormLine = { description: string; inventoryItemId: string; qty: string; unitPrice: string };

const EMPTY_LINE: FormLine = { description: "", inventoryItemId: "", qty: "1", unitPrice: "" };

export default function InvoicesClient({
  invoices: initial,
  inventory,
}: {
  invoices: Invoice[];
  inventory: InventoryOption[];
}) {
  const [invoices, setInvoices] = useState(initial);
  const [modal, setModal] = useState<Invoice | "new" | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [lines, setLines] = useState<FormLine[]>([{ ...EMPTY_LINE }]);
  const [printTarget, setPrintTarget] = useState<Invoice | null>(null);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  function showToast(msg: string) {
    setToast(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setLines([{ ...EMPTY_LINE }]);
    setModal("new");
  }

  function openEdit(inv: Invoice) {
    setForm({
      type: inv.type,
      date: inv.date || "",
      dueDate: inv.dueDate || "",
      clientName: inv.clientName,
      clientEmail: inv.clientEmail || "",
      clientPhone: inv.clientPhone || "",
      clientAddr: inv.clientAddr || "",
      notes: inv.notes || "",
      status: inv.status,
      tax: inv.tax,
    });
    setLines(
      inv.items.length > 0
        ? inv.items.map(it => ({
            description: it.description,
            inventoryItemId: it.inventoryItemId || "",
            qty: String(it.qty),
            unitPrice: String(it.unitPrice),
          }))
        : [{ ...EMPTY_LINE }]
    );
    setModal(inv);
  }

  function setLine(i: number, key: keyof FormLine, val: string) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  }

  function addFromInventory(item: InventoryOption) {
    setLines(prev => [
      ...prev.filter(l => l.description || l.unitPrice),
      { description: `${item.name}${item.brand ? " – " + item.brand : ""}`, inventoryItemId: item.id, qty: "1", unitPrice: String(item.priceSold) },
    ]);
  }

  function removeLine(i: number) {
    setLines(prev => prev.length === 1 ? [{ ...EMPTY_LINE }] : prev.filter((_, idx) => idx !== i));
  }

  function computedLines() {
    return lines.map(l => ({
      description: l.description,
      inventoryItemId: l.inventoryItemId || null,
      qty: parseFloat(l.qty) || 1,
      unitPrice: parseFloat(l.unitPrice) || 0,
      total: (parseFloat(l.qty) || 1) * (parseFloat(l.unitPrice) || 0),
    }));
  }

  function subtotal() {
    return computedLines().reduce((s, l) => s + l.total, 0);
  }

  function taxAmount() {
    return subtotal() * (form.tax / 100);
  }

  function grandTotal() {
    return subtotal() + taxAmount();
  }

  async function save() {
    if (!form.clientName.trim()) { showToast("Client name is required"); return; }
    const validLines = computedLines().filter(l => l.description.trim());
    if (validLines.length === 0) { showToast("Add at least one line item"); return; }
    setSaving(true);

    const payload = {
      ...form,
      tax: Number(form.tax),
      subtotal: subtotal(),
      total: grandTotal(),
      items: validLines,
    };

    if (modal === "new") {
      const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const created = await res.json();
      setInvoices(prev => [created, ...prev]);
      showToast("Invoice created!");
    } else if (modal && typeof modal === "object") {
      const res = await fetch(`/api/invoices/${modal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const updated = await res.json();
      setInvoices(prev => prev.map(inv => inv.id === modal.id ? updated : inv));
      showToast("Invoice updated!");
    }

    setModal(null);
    setSaving(false);
  }

  async function deleteInvoice() {
    if (!modal || modal === "new" || typeof modal !== "object") return;
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${modal.id}`, { method: "DELETE" });
    setInvoices(prev => prev.filter(inv => inv.id !== modal.id));
    setModal(null);
    showToast("Deleted");
  }

  function handlePrint(inv: Invoice) {
    setPrintTarget(inv);
    setTimeout(() => window.print(), 100);
  }

  const f = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const sub = subtotal();
  const taxAmt = taxAmount();
  const total = grandTotal();

  const labelStyle: React.CSSProperties = {
    fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6,
  };

  return (
    <div>
      {/* Print view — hidden on screen, shown when printing */}
      {printTarget && (
        <div ref={printRef} className="print-invoice-view" style={{ display: "none" }}>
          <PrintInvoice invoice={printTarget} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="section-title">
          Invoices & Receipts{" "}
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 400 }}>({invoices.length})</span>
        </div>
        <button className="add-btn" onClick={openAdd}>+ New Invoice</button>
      </div>

      {/* KPIs */}
      <div className="g3" style={{ marginBottom: "1.5rem" }}>
        <div className="kpi-card accent1">
          <div className="kpi-label">Total Invoiced</div>
          <div className="kpi-value">{fmtMoney(invoices.reduce((s, i) => s + i.total, 0))}</div>
        </div>
        <div className="kpi-card accent2">
          <div className="kpi-label">Paid</div>
          <div className="kpi-value">{fmtMoney(invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.total, 0))}</div>
        </div>
        <div className="kpi-card accent3">
          <div className="kpi-label">Outstanding</div>
          <div className="kpi-value">{fmtMoney(invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + i.total, 0))}</div>
        </div>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase" }}>
          No invoices yet. Create your first one!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {invoices.map(inv => {
            const sc = STATUS_COLORS[inv.status] || "#94a3b8";
            return (
              <div
                key={inv.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", gap: 12 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", fontWeight: 700, color: "var(--gold)" }}>{inv.number}</span>
                    <span className="chip" style={{ background: sc + "18", color: sc, borderColor: sc + "40", fontSize: "0.6rem" }}>{inv.status}</span>
                    <span className="chip" style={{ background: "var(--navy-800)", color: "var(--text-muted)", fontSize: "0.6rem" }}>{inv.type}</span>
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--cream)", marginTop: 3 }}>{inv.clientName}</div>
                  <div style={{ fontSize: "0.67rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                    {fmtDate(inv.date)}{inv.dueDate ? ` · Due ${fmtDate(inv.dueDate)}` : ""} · {inv.items.length} item{inv.items.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 700, color: "var(--gold-light)" }}>{fmtMoney(inv.total)}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                    <button className="btn" style={{ padding: "4px 10px", fontSize: "0.65rem" }} onClick={() => handlePrint(inv)}>Print</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.65rem" }} onClick={() => openEdit(inv)}>Edit</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" style={{ maxWidth: 740, width: "100%" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--navy-900)", borderRadius: "16px 16px 0 0" }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--cream)", textTransform: "uppercase" }}>
                {modal === "new" ? "New Invoice / Receipt" : `Edit ${(modal as Invoice).number}`}
              </div>
              <button onClick={() => setModal(null)} style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text-muted)", cursor: "pointer", padding: "6px 10px", borderRadius: 7 }}>✕</button>
            </div>

            <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", maxHeight: "70vh", overflowY: "auto" }}>

              {/* Type + Status */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Type</span>
                  <select className="input" value={form.type} onChange={f("type")}>
                    <option>Invoice</option>
                    <option>Receipt</option>
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Status</span>
                  <select className="input" value={form.status} onChange={f("status")}>
                    <option>Draft</option>
                    <option>Sent</option>
                    <option>Paid</option>
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Date</span>
                  <input className="input" type="date" value={form.date} onChange={f("date")} />
                </label>
                {form.type === "Invoice" && (
                  <label style={{ display: "block" }}>
                    <span style={labelStyle}>Due Date</span>
                    <input className="input" type="date" value={form.dueDate} onChange={f("dueDate")} />
                  </label>
                )}
              </div>

              {/* Client info */}
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Client Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.9rem" }}>
                  <label style={{ display: "block" }}>
                    <span style={labelStyle}>Client Name *</span>
                    <input className="input" value={form.clientName} onChange={f("clientName")} placeholder="Full name or company" />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={labelStyle}>Email</span>
                    <input className="input" type="email" value={form.clientEmail} onChange={f("clientEmail")} placeholder="client@email.com" />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={labelStyle}>Phone</span>
                    <input className="input" value={form.clientPhone} onChange={f("clientPhone")} placeholder="+256 …" />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={labelStyle}>Address</span>
                    <input className="input" value={form.clientAddr} onChange={f("clientAddr")} placeholder="City, Country" />
                  </label>
                </div>
              </div>

              {/* Add from inventory */}
              {inventory.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Add from Inventory</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {inventory.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addFromInventory(item)}
                        style={{
                          background: "var(--navy-800)", border: "1px solid var(--border-strong)",
                          color: "var(--cream)", borderRadius: 7, padding: "5px 11px",
                          fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <span>{item.name}{item.brand ? ` – ${item.brand}` : ""}</span>
                        <span style={{ color: "var(--gold)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem" }}>{fmtMoney(item.priceSold)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Line items */}
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Line Items</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lines.map((line, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px auto", gap: 6, alignItems: "end" }}>
                      <label style={{ display: "block" }}>
                        {i === 0 && <span style={labelStyle}>Description</span>}
                        <input className="input" value={line.description} onChange={e => setLine(i, "description", e.target.value)} placeholder="Item or service" />
                      </label>
                      <label style={{ display: "block" }}>
                        {i === 0 && <span style={labelStyle}>Qty</span>}
                        <input className="input" type="number" min="0" step="0.01" value={line.qty} onChange={e => setLine(i, "qty", e.target.value)} />
                      </label>
                      <label style={{ display: "block" }}>
                        {i === 0 && <span style={labelStyle}>Unit Price</span>}
                        <input className="input" type="number" min="0" step="1" value={line.unitPrice} onChange={e => setLine(i, "unitPrice", e.target.value)} placeholder="0" />
                      </label>
                      <div>
                        {i === 0 && <span style={{ ...labelStyle, display: "block" }}>&nbsp;</span>}
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 7, padding: "9px 10px", cursor: "pointer", fontSize: "0.75rem" }}
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setLines(prev => [...prev, { ...EMPTY_LINE }])}
                  style={{ marginTop: 10, background: "var(--navy-800)", border: "1px dashed var(--border-strong)", color: "var(--text-muted)", borderRadius: 7, padding: "7px 14px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", width: "100%" }}
                >
                  + Add Line
                </button>
              </div>

              {/* Totals + Tax */}
              <div style={{ background: "var(--navy-900)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>Subtotal</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtMoney(sub)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Tax</span>
                    <input
                      className="input"
                      type="number" min="0" max="100" step="0.5"
                      value={form.tax}
                      onChange={f("tax")}
                      style={{ width: 64, padding: "4px 8px", fontSize: "0.8rem" }}
                    />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>%</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>{fmtMoney(taxAmt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-strong)", paddingTop: 8 }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--cream)" }}>Total</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 800, color: "var(--gold)" }}>{fmtMoney(total)}</span>
                </div>
              </div>

              {/* Notes */}
              <label style={{ display: "block" }}>
                <span style={labelStyle}>Notes / Payment Terms</span>
                <textarea className="input" rows={2} value={form.notes} onChange={f("notes")} style={{ resize: "vertical", minHeight: 56 }} placeholder="e.g. Payment due within 30 days…" />
              </label>

            </div>

            {/* Footer */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-strong)", display: "flex", gap: "0.75rem", justifyContent: "flex-end", background: "var(--navy-900)", borderRadius: "0 0 16px 16px" }}>
              {modal !== "new" && (
                <button className="btn btn-danger" onClick={deleteInvoice} style={{ marginRight: "auto" }}>Delete</button>
              )}
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toastVisible ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

// ── Print Invoice Component ──────────────────────────────────────────────────

function PrintInvoice({ invoice }: { invoice: Invoice }) {
  function fmtMoney(v: number) {
    return "USh " + Math.round(v).toLocaleString("en-US");
  }
  function fmtDate(s: string | null) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  }

  return (
    <div className="print-page">
      {/* Letterhead */}
      <div className="print-header-row">
        <div>
          <div className="print-brand">SMIKS STUDIO HUB</div>
          <div className="print-brand-sub">Professional Recording Studio</div>
          <div className="print-meta-text">Kampala, Uganda</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="print-doc-type">{invoice.type}</div>
          <div className="print-doc-number"># {invoice.number}</div>
          <div className="print-meta-text">Date: {fmtDate(invoice.date)}</div>
          {invoice.dueDate && <div className="print-meta-text">Due: {fmtDate(invoice.dueDate)}</div>}
          <div className={`print-status-chip print-status-${invoice.status.toLowerCase()}`}>{invoice.status}</div>
        </div>
      </div>

      <div className="print-divider" />

      {/* Bill To */}
      <div className="print-bill-to">
        <div className="print-section-label">Bill To</div>
        <div className="print-client-name">{invoice.clientName}</div>
        {invoice.clientEmail && <div className="print-meta-text">{invoice.clientEmail}</div>}
        {invoice.clientPhone && <div className="print-meta-text">{invoice.clientPhone}</div>}
        {invoice.clientAddr && <div className="print-meta-text">{invoice.clientAddr}</div>}
      </div>

      {/* Items table */}
      <table className="print-table">
        <thead>
          <tr>
            <th className="print-th print-th-desc">Description</th>
            <th className="print-th print-th-num">Qty</th>
            <th className="print-th print-th-num">Unit Price</th>
            <th className="print-th print-th-num">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i}>
              <td className="print-td">{item.description}</td>
              <td className="print-td print-td-num">{item.qty}</td>
              <td className="print-td print-td-num">{fmtMoney(item.unitPrice)}</td>
              <td className="print-td print-td-num">{fmtMoney(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="print-totals">
        <div className="print-total-row">
          <span>Subtotal</span>
          <span>{fmtMoney(invoice.subtotal)}</span>
        </div>
        {invoice.tax > 0 && (
          <div className="print-total-row">
            <span>Tax ({invoice.tax}%)</span>
            <span>{fmtMoney(invoice.total - invoice.subtotal)}</span>
          </div>
        )}
        <div className="print-total-row print-total-grand">
          <span>Total</span>
          <span>{fmtMoney(invoice.total)}</span>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="print-notes">
          <div className="print-section-label">Notes</div>
          <div className="print-notes-text">{invoice.notes}</div>
        </div>
      )}

      <div className="print-footer">Thank you for your business!</div>
    </div>
  );
}
