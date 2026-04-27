"use client";

import { useState, useMemo } from "react";

interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  qty: number;
  dateBought: string | null;
  priceBought: number;
  dateSold: string | null;
  priceSold: number;
  status: string;
  condition: string;
  notes: string | null;
}

const CATEGORIES = ["Recording", "Podcast", "Livestreaming", "Mixing & Mastering", "Accessories", "Cables & Connectors", "Other"];
const STATUSES = ["In Stock", "Sold", "Reserved", "Repair", "Cancelled", "Returned", "Written Off"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

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
  "Cancelled": "#f87171",
  "Returned": "#fb923c",
  "Reserved": "#38bdf8",
  "Repair": "#fb923c",
  "Written Off": "#64748b",
};

function fmtDate(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function fmtMoney(v: number) {
  if (!v) return "—";
  return "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CatChip({ cat }: { cat: string }) {
  const c = CAT_COLORS[cat] || "#94a3b8";
  return (
    <span className="chip" style={{ background: c + "18", color: c, borderColor: c + "40" }}>
      {cat}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || "#94a3b8";
  return (
    <span className="chip" style={{ background: c + "18", color: c, borderColor: c + "40" }}>
      {status}
    </span>
  );
}

const EMPTY_FORM = {
  name: "", brand: "", category: "Recording", qty: 1,
  dateBought: "", priceBought: "", dateSold: "", priceSold: "",
  status: "In Stock", condition: "New", notes: "",
};

const PAGE_SIZE = 25;

export default function InventoryClient({ items: initial }: { items: InventoryItem[] }) {
  const [items, setItems] = useState(initial);
  const [modal, setModal] = useState<InventoryItem | "new" | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  const filtered = useMemo(() => {
    return items.filter(i => {
      const q = search.toLowerCase();
      const matchQ = !q || i.name.toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q);
      const matchCat = !activeCat || i.category === activeCat;
      const matchSt = !statusFilter || i.status === statusFilter;
      return matchQ && matchCat && matchSt;
    });
  }, [items, search, activeCat, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setModal("new");
  }

  function openEdit(item: InventoryItem) {
    setForm({
      name: item.name,
      brand: item.brand || "",
      category: item.category,
      qty: item.qty,
      dateBought: item.dateBought || "",
      priceBought: String(item.priceBought || ""),
      dateSold: item.dateSold || "",
      priceSold: String(item.priceSold || ""),
      status: item.status,
      condition: item.condition,
      notes: item.notes || "",
    });
    setModal(item);
  }

  async function save() {
    if (!form.name.trim()) { showToast("Item name is required"); return; }
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category,
      qty: Number(form.qty) || 1,
      dateBought: form.dateBought || null,
      priceBought: parseFloat(String(form.priceBought)) || 0,
      dateSold: form.dateSold || null,
      priceSold: parseFloat(String(form.priceSold)) || 0,
      status: form.status,
      condition: form.condition,
      notes: form.notes.trim() || null,
    };
    if (modal === "new") {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      setItems(prev => [created, ...prev]);
      showToast("Item added!");
    } else if (modal && typeof modal === "object") {
      await fetch(`/api/inventory/${modal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setItems(prev => prev.map(i => i.id === modal.id ? { ...i, ...payload } : i));
      showToast("Item updated!");
    }
    setModal(null);
  }

  async function deleteItem() {
    if (!modal || modal === "new" || typeof modal !== "object") return;
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/inventory/${modal.id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== modal.id));
    setModal(null);
    showToast("Item deleted");
  }

  const f = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="section-title">Inventory <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 400 }}>({items.length} items)</span></div>
        <button className="add-btn" onClick={openAdd}>+ Add Item</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
        <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#7070a0" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#7070a0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input placeholder="Search items, brands..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["All", ...CATEGORIES].map(c => (
            <button key={c} className={`filter-btn ${(c === "All" && !activeCat) || c === activeCat ? "active" : ""}`}
              onClick={() => { setActiveCat(c === "All" ? "" : c); setPage(1); }}>
              {c}
            </button>
          ))}
        </div>
        <select className="filter-btn" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ cursor: "pointer", background: "var(--surface)", color: "var(--text-2)" }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 60px 110px 110px 110px", padding: "11px 18px", borderBottom: "1px solid var(--border-strong)", background: "var(--navy-800)" }}>
          {["Item", "Category", "Qty", "Date Bought", "Price", "Status"].map(h => (
            <div key={h} style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)" }}>{h}</div>
          ))}
        </div>
        <div style={{ maxHeight: 600, overflowY: "auto" }}>
          {pageItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              No items found
            </div>
          ) : pageItems.map(item => (
            <div key={item.id} onClick={() => openEdit(item)} style={{ display: "grid", gridTemplateColumns: "1fr 150px 60px 110px 110px 110px", padding: "12px 18px", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--cream)", fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                {item.brand && <div style={{ fontSize: "0.67rem", color: "var(--text-muted)", fontWeight: 500 }}>{item.brand}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center" }}><CatChip cat={item.category} /></div>
              <div style={{ display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: "var(--cream)" }}>{item.qty}</div>
              <div style={{ display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", color: "var(--text-2)" }}>{fmtDate(item.dateBought)}</div>
              <div style={{ display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", fontWeight: 700, color: "var(--gold-light)" }}>{fmtMoney(item.priceBought)}</div>
              <div style={{ display: "flex", alignItems: "center" }}><StatusChip status={item.status} /></div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem 1.25rem", background: "var(--navy-800)", borderTop: "1px solid var(--border-strong)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", color: "var(--text-muted)" }}>
            {filtered.length === 0 ? "0 items" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="filter-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`filter-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="filter-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>›</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid var(--border-strong)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: "var(--navy-900)", borderRadius: "16px 16px 0 0" }}>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  {modal === "new" ? "Add New Item" : typeof modal === "object" ? modal.name : ""}
                </div>
                {modal !== "new" && typeof modal === "object" && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "var(--gold)", marginTop: 4 }}>{modal.id}</div>
                )}
              </div>
              <button onClick={() => setModal(null)} style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem", padding: "6px 10px", borderRadius: 7 }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Item Name</span>
                  <input className="input" value={form.name} onChange={f("name")} placeholder="Item name" />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Brand / Model</span>
                  <input className="input" value={form.brand} onChange={f("brand")} placeholder="Brand or model" />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Category</span>
                  <select className="input" value={form.category} onChange={f("category")}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Quantity</span>
                  <input className="input" type="number" min="1" value={form.qty} onChange={f("qty")} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Date Bought</span>
                  <input className="input" type="date" value={form.dateBought} onChange={f("dateBought")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Price Bought ($)</span>
                  <input className="input" type="number" step="0.01" value={form.priceBought} onChange={f("priceBought")} placeholder="0.00" />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Date Sold</span>
                  <input className="input" type="date" value={form.dateSold} onChange={f("dateSold")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Price Sold ($)</span>
                  <input className="input" type="number" step="0.01" value={form.priceSold} onChange={f("priceSold")} placeholder="0.00" />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Status</span>
                  <select className="input" value={form.status} onChange={f("status")}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Condition</span>
                  <select className="input" value={form.condition} onChange={f("condition")}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <label style={{ display: "block" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Notes</span>
                <textarea className="input" rows={2} value={form.notes} onChange={f("notes")} placeholder="Any notes..." style={{ resize: "vertical", minHeight: 60 }} />
              </label>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-strong)", display: "flex", gap: "0.75rem", justifyContent: "flex-end", background: "var(--navy-900)", borderRadius: "0 0 16px 16px" }}>
              {modal !== "new" && (
                <button className="btn btn-danger" onClick={deleteItem} style={{ marginRight: "auto" }}>Delete</button>
              )}
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`toast ${toastVisible ? "show" : ""}`}>{toast}</div>
    </div>
  );
}
