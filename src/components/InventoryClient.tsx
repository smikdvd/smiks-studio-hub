"use client";

import { useState, useMemo } from "react";

interface InventorySale {
  id: string;
  qtySold: number;
  priceSold: number;
  dateSold: string | null;
  notes: string | null;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  qty: number;
  dateBought: string | null;
  priceBought: number;
  shippingCost: number;
  priceSold: number;
  status: string;
  condition: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  sales: InventorySale[];
}

const CATEGORIES = ["Recording", "Podcast", "Livestreaming", "Mixing & Mastering", "Accessories", "Cables & Connectors", "Other"];
const STATUSES = ["In Stock", "In Transit", "Sold", "Reserved", "Repair", "Cancelled", "Returned", "Written Off"];
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
  "In Transit": "#e8c070",
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

function buildDateSearch(s: string | null): string {
  if (!s) return "";
  // Parse date-only strings locally to avoid UTC timezone shift
  const parts = s.split("-").map(Number);
  const dt = parts.length >= 2 ? new Date(parts[0], parts[1] - 1, parts[2] || 1) : new Date(s);
  return [
    s,                                                                                        // 2025-03-21
    dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }),     // 21 Mar 25
    dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),     // 21 Mar 2025
    dt.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),                     // Mar 2025
    dt.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),                      // March 2025
    dt.toLocaleDateString("en-US", { month: "long" }),                                       // March
    String(parts[0]),                                                                         // 2025
  ].join(" ").toLowerCase();
}

function fmtMoney(v: number) {
  if (!v) return "—";
  return "USh " + Number(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function CatChip({ cat }: { cat: string }) {
  const c = CAT_COLORS[cat] || "#94a3b8";
  return <span className="chip" style={{ background: c + "18", color: c, borderColor: c + "40" }}>{cat}</span>;
}

function StatusChip({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || "#94a3b8";
  return <span className="chip" style={{ background: c + "18", color: c, borderColor: c + "40" }}>{status}</span>;
}

function getAvailable(item: InventoryItem) {
  const totalSold = item.sales.reduce((s, sale) => s + sale.qtySold, 0);
  return item.qty - totalSold;
}

const EMPTY_FORM = {
  name: "", brand: "", category: "Recording", qty: 1,
  dateBought: "", priceBought: "", shippingCost: "", priceSold: "",
  status: "In Stock", condition: "New", notes: "",
};

const EMPTY_SALE = { qtySold: "1", priceSold: "", dateSold: new Date().toISOString().split("T")[0], notes: "" };

const PAGE_SIZE = 25;

const labelStyle: React.CSSProperties = {
  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6,
};

export default function InventoryClient({ items: initial }: { items: InventoryItem[] }) {
  const [items, setItems] = useState(initial);
  const [modal, setModal] = useState<InventoryItem | "new" | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [receiptFilter, setReceiptFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Sale recording state
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleForm, setSaleForm] = useState({ ...EMPTY_SALE });
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleError, setSaleError] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  const filtered = useMemo(() => {
    const list = items.filter(i => {
      const q = search.toLowerCase().trim();
      const itemDate = i.dateBought || (i.sales.length > 0 ? i.sales[i.sales.length - 1].dateSold : null);
      const dateSearch = buildDateSearch(itemDate);
      const matchQ = !q
        || i.name.toLowerCase().includes(q)
        || (i.brand || "").toLowerCase().includes(q)
        || i.id.toLowerCase().includes(q)
        || dateSearch.includes(q);
      const matchCat = !activeCat || i.category === activeCat;
      const matchSt = !statusFilter
        ? true
        : statusFilter === "__no_price__"
          ? (!i.priceSold || i.priceSold === 0)
          : i.status === statusFilter;
      const matchRcp = !receiptFilter || (i.notes?.includes("[RCP]") ?? false);
      return matchQ && matchCat && matchSt && matchRcp;
    });
    // Sort by date: use dateBought if set, else first sale's dateSold, else createdAt — newest first
    return list.sort((a, b) => {
      const getDate = (i: InventoryItem) =>
        i.dateBought
          ? i.dateBought
          : i.sales.length > 0
            ? (i.sales[i.sales.length - 1].dateSold ?? i.createdAt)
            : i.createdAt;
      const aDate = getDate(a);
      const bDate = getDate(b);
      return bDate > aDate ? 1 : bDate < aDate ? -1 : 0;
    });
  }, [items, search, activeCat, statusFilter, receiptFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setModal("new");
    setShowSaleForm(false);
    setSaleForm({ ...EMPTY_SALE });
    setSaleError("");
  }

  function openEdit(item: InventoryItem) {
    setForm({
      name: item.name,
      brand: item.brand || "",
      category: item.category,
      qty: item.qty,
      dateBought: item.dateBought || "",
      priceBought: String(item.priceBought || ""),
      shippingCost: String(item.shippingCost || ""),
      priceSold: String(item.priceSold || ""),
      status: item.status,
      condition: item.condition,
      notes: item.notes || "",
    });
    setSaleForm({ ...EMPTY_SALE, priceSold: String(item.priceSold || "") });
    setShowSaleForm(false);
    setSaleError("");
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
      shippingCost: parseFloat(String(form.shippingCost)) || 0,
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
      const res = await fetch(`/api/inventory/${modal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setItems(prev => prev.map(i => i.id === modal.id ? updated : i));
      showToast("Item updated!");
    }
    setModal(null);
  }

  async function recordSale() {
    if (!modal || modal === "new" || typeof modal !== "object") return;
    const qty = parseInt(saleForm.qtySold) || 0;
    const price = parseFloat(saleForm.priceSold) || 0;
    if (qty < 1) { setSaleError("Quantity must be at least 1"); return; }
    if (price <= 0) { setSaleError("Sale price is required"); return; }

    setSaleLoading(true);
    setSaleError("");
    const res = await fetch(`/api/inventory/${modal.id}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qtySold: qty, priceSold: price, dateSold: saleForm.dateSold || null, notes: saleForm.notes || null }),
    });
    if (!res.ok) {
      const err = await res.json();
      setSaleError(err.error || "Failed to record sale");
      setSaleLoading(false);
      return;
    }
    const newSale: InventorySale = await res.json();
    // Update local state: add sale to item, recalculate available, update status
    setItems(prev => prev.map(i => {
      if (i.id !== modal.id) return i;
      const updatedSales = [...i.sales, newSale];
      const totalSold = updatedSales.reduce((s, sale) => s + sale.qtySold, 0);
      const available = i.qty - totalSold;
      return { ...i, sales: updatedSales, status: available === 0 ? "Sold" : "In Stock" };
    }));
    // Also update the modal's item ref
    setModal(prev => {
      if (!prev || prev === "new" || typeof prev !== "object") return prev;
      const updatedSales = [...prev.sales, newSale];
      const totalSold = updatedSales.reduce((s, sale) => s + sale.qtySold, 0);
      const available = prev.qty - totalSold;
      return { ...prev, sales: updatedSales, status: available === 0 ? "Sold" : "In Stock" };
    });
    setSaleForm({ ...EMPTY_SALE, priceSold: saleForm.priceSold });
    setShowSaleForm(false);
    showToast("Sale recorded!");
    setSaleLoading(false);
  }

  async function deleteSale(saleId: string) {
    if (!modal || modal === "new" || typeof modal !== "object") return;
    if (!confirm("Remove this sale record?")) return;
    await fetch(`/api/inventory/${modal.id}/sales/${saleId}`, { method: "DELETE" });
    setItems(prev => prev.map(i => {
      if (i.id !== modal.id) return i;
      const updatedSales = i.sales.filter(s => s.id !== saleId);
      const totalSold = updatedSales.reduce((s, sale) => s + sale.qtySold, 0);
      const available = i.qty - totalSold;
      return { ...i, sales: updatedSales, status: available === 0 ? "Sold" : "In Stock" };
    }));
    setModal(prev => {
      if (!prev || prev === "new" || typeof prev !== "object") return prev;
      const updatedSales = prev.sales.filter(s => s.id !== saleId);
      const totalSold = updatedSales.reduce((s, sale) => s + sale.qtySold, 0);
      const available = prev.qty - totalSold;
      return { ...prev, sales: updatedSales, status: available === 0 ? "Sold" : "In Stock" };
    });
    showToast("Sale removed");
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

  const sf = (key: keyof typeof EMPTY_SALE) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSaleForm(prev => ({ ...prev, [key]: e.target.value }));

  const currentItem = modal && modal !== "new" && typeof modal === "object" ? modal : null;
  const available = currentItem ? getAvailable(currentItem) : 0;
  const totalSoldQty = currentItem ? currentItem.sales.reduce((s, sale) => s + sale.qtySold, 0) : 0;

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
          <input placeholder="Search items, brands, dates..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["All", ...CATEGORIES].map(c => (
            <button key={c} className={`filter-btn ${(c === "All" && !activeCat) || c === activeCat ? "active" : ""}`}
              onClick={() => { setActiveCat(c === "All" ? "" : c); setPage(1); }}>
              {c}
            </button>
          ))}
        </div>
        <button
          className={`filter-btn ${receiptFilter ? "active" : ""}`}
          onClick={() => { setReceiptFilter(v => !v); setPage(1); }}
          style={receiptFilter ? { background: "rgba(248,113,113,0.18)", color: "#fca5a5", borderColor: "rgba(248,113,113,0.5)" } : {}}>
          🧾 Receipts ({items.filter(i => i.notes?.includes("[RCP]")).length})
        </button>
        <select className="filter-btn" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ cursor: "pointer", background: "var(--surface)", color: "var(--text-2)" }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
          <option value="__no_price__">No Price Indicated</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-scroll" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 150px 100px 120px 120px 120px", padding: "11px 18px", borderBottom: "1px solid var(--border-strong)", background: "var(--navy-800)" }}>
          {["ID", "Item", "Category", "Stock", "Date", "Price", "Status"].map(h => (
            <div key={h} style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)" }}>{h}</div>
          ))}
        </div>
        <div style={{ maxHeight: 600, overflowY: "auto" }}>
          {pageItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              No items found
            </div>
          ) : pageItems.map(item => {
            const avail = getAvailable(item);
            const soldQty = item.sales.reduce((s, sale) => s + sale.qtySold, 0);
            const partial = soldQty > 0 && avail > 0;
            const illegible = item.notes?.includes("⚠️ ILLEGIBLE") ?? false;
            const isReceipt = item.notes?.includes("[RCP]") ?? false;
            const nameRed = isReceipt || illegible;
            // For receipt items with no dateBought, show the sale date instead
            const displayDate = item.dateBought
              ? item.dateBought
              : (item.sales.length > 0 ? (item.sales[item.sales.length - 1].dateSold ?? null) : null);
            return (
              <div key={item.id} onClick={() => openEdit(item)}
                style={{ display: "grid", gridTemplateColumns: "80px 1fr 150px 100px 120px 120px 120px", padding: "12px 18px", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <div style={{ display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }} title={item.id}>{item.id.slice(0, 8)}</div>
                <div>
                  <div style={{ fontWeight: 700, color: nameRed ? "#fca5a5" : "var(--cream)", fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {illegible && <span style={{ marginRight: 5, fontSize: "0.7rem" }}>⚠️</span>}
                    {isReceipt && !illegible && <span style={{ marginRight: 5, fontSize: "0.7rem" }}>🧾</span>}
                    {item.name}
                  </div>
                  {item.brand && <div style={{ fontSize: "0.67rem", color: "var(--text-muted)", fontWeight: 500 }}>{item.brand}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center" }}><CatChip cat={item.category} /></div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: avail === 0 ? "#f87171" : "var(--cream)" }}>{avail}</span>
                  {partial && (
                    <span style={{ fontSize: "0.6rem", color: "var(--gold)", fontWeight: 700 }}>/{item.qty}</span>
                  )}
                  {partial && (
                    <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600 }}>({soldQty} sold)</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", color: "var(--text-2)" }}>{fmtDate(displayDate)}</div>
                <div style={{ display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", fontWeight: 700, color: "var(--gold-light)" }}>{fmtMoney(item.priceBought)}</div>
                <div style={{ display: "flex", alignItems: "center" }}><StatusChip status={item.status} /></div>
              </div>
            );
          })}
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
        <div className="modal-overlay" onClick={e => e.stopPropagation()} style={{ cursor: "default" }}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid var(--border-strong)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: "var(--navy-900)", borderRadius: "16px 16px 0 0" }}>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  {modal === "new" ? "Add New Item" : typeof modal === "object" ? modal.name : ""}
                </div>
                {currentItem && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "var(--gold)" }}>{currentItem.id}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", fontWeight: 700, color: available > 0 ? "#34d399" : "#f87171" }}>
                      {available} available
                    </span>
                    {totalSoldQty > 0 && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        ({totalSoldQty} of {currentItem.qty} sold)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "70vh", overflowY: "auto" }}>

              {/* Receipt item banner */}
              {currentItem?.notes?.includes("[RCP]") && (
                <div style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}>{currentItem.notes?.includes("⚠️ ILLEGIBLE") ? "⚠️" : "🧾"}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.75rem", color: "#fca5a5", marginBottom: 2 }}>
                      {currentItem.notes?.includes("⚠️ ILLEGIBLE") ? "DIFFICULT TO READ" : "IMPORTED FROM RECEIPT"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(252,165,165,0.8)", lineHeight: 1.5 }}>
                      {currentItem.notes?.includes("⚠️ ILLEGIBLE")
                        ? "This item was flagged as hard to read on the physical receipt. Please verify the details and update as needed."
                        : "This item was imported from the physical receipt book. Verify and update details as needed."}
                    </div>
                  </div>
                </div>
              )}

              {/* Item fields */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Item Name</span>
                  <input className="input" value={form.name} onChange={f("name")} placeholder="Item name" />
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Brand / Model</span>
                  <input className="input" value={form.brand} onChange={f("brand")} placeholder="Brand or model" />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Category</span>
                  <select className="input" value={form.category} onChange={f("category")}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Total Quantity (purchased)</span>
                  <input className="input" type="number" min="1" value={form.qty} onChange={f("qty")} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Date Bought</span>
                  <input className="input" type="date" value={form.dateBought} onChange={f("dateBought")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Cost Price (per unit)</span>
                  <input className="input" type="number" step="1" value={form.priceBought} onChange={f("priceBought")} placeholder="0" />
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Shipping Cost (total)</span>
                  <input className="input" type="number" step="1" value={form.shippingCost} onChange={f("shippingCost")} placeholder="0" />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Selling Price (default)</span>
                  <input className="input" type="number" step="1" value={form.priceSold} onChange={f("priceSold")} placeholder="0" />
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Condition</span>
                  <select className="input" value={form.condition} onChange={f("condition")}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Status</span>
                  <select className="input" value={form.status} onChange={f("status")}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              {/* Profit calculator */}
              {(parseFloat(String(form.priceBought)) > 0 || parseFloat(String(form.priceSold)) > 0) && (() => {
                const bought = parseFloat(String(form.priceBought)) || 0;
                const shipping = parseFloat(String(form.shippingCost)) || 0;
                const sold = parseFloat(String(form.priceSold)) || 0;
                const qty = Number(form.qty) || 1;
                const totalCost = bought * qty + shipping;
                const costPerUnit = totalCost / qty;
                const profit = sold - costPerUnit;
                const margin = costPerUnit > 0 ? (profit / costPerUnit) * 100 : 0;
                const profitColor = profit >= 0 ? "#34d399" : "#f87171";
                return (
                  <div style={{ background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.2)", borderRadius: "var(--radius-sm)", padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Total Cost</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: "var(--cream)" }}>USh {totalCost.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    </div>
                    {shipping > 0 && (
                      <div>
                        <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Cost / unit</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: "var(--cream)" }}>USh {Math.round(costPerUnit).toLocaleString("en-US")}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Profit / unit</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: profitColor }}>{profit >= 0 ? "+" : ""}USh {Math.round(profit).toLocaleString("en-US")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Margin</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: profitColor }}>{margin.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })()}

              <label style={{ display: "block" }}>
                <span style={labelStyle}>Notes</span>
                <textarea className="input" rows={2} value={form.notes} onChange={f("notes")} placeholder="Any notes..." style={{ resize: "vertical", minHeight: 60 }} />
              </label>

              {/* ── Sales history (edit mode only) ── */}
              {currentItem && (
                <div style={{ borderTop: "1px solid var(--border-strong)", paddingTop: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Sales History ({currentItem.sales.length})
                    </div>
                    {available > 0 && (
                      <button
                        type="button"
                        onClick={() => { setShowSaleForm(s => !s); setSaleError(""); }}
                        className="add-btn"
                        style={{ padding: "5px 12px", fontSize: "0.68rem" }}
                      >
                        {showSaleForm ? "Cancel" : "+ Record Sale"}
                      </button>
                    )}
                    {available === 0 && (
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f87171" }}>All units sold</span>
                    )}
                  </div>

                  {/* Record sale form */}
                  {showSaleForm && (
                    <div style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: 10, padding: "1rem", marginBottom: 12 }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                        Record Sale · {available} unit{available !== 1 ? "s" : ""} available
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
                        <label style={{ display: "block" }}>
                          <span style={labelStyle}>Qty Sold</span>
                          <input className="input" type="number" min="1" max={available} value={saleForm.qtySold} onChange={sf("qtySold")} />
                        </label>
                        <label style={{ display: "block" }}>
                          <span style={labelStyle}>Sale Price (per unit)</span>
                          <input className="input" type="number" step="1" value={saleForm.priceSold} onChange={sf("priceSold")} placeholder="0" />
                        </label>
                        <label style={{ display: "block" }}>
                          <span style={labelStyle}>Date Sold</span>
                          <input className="input" type="date" value={saleForm.dateSold} onChange={sf("dateSold")} />
                        </label>
                        <label style={{ display: "block" }}>
                          <span style={labelStyle}>Notes</span>
                          <input className="input" value={saleForm.notes} onChange={sf("notes")} placeholder="Optional" />
                        </label>
                      </div>
                      {saleError && (
                        <div style={{ marginTop: 8, fontSize: "0.75rem", color: "#f87171", fontWeight: 600 }}>{saleError}</div>
                      )}
                      <button
                        type="button"
                        className="btn"
                        onClick={recordSale}
                        disabled={saleLoading}
                        style={{ marginTop: 10 }}
                      >
                        {saleLoading ? "Saving…" : "Save Sale"}
                      </button>
                    </div>
                  )}

                  {/* Sales list */}
                  {currentItem.sales.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>No sales recorded yet</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {currentItem.sales.map(sale => (
                        <div key={sale.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--navy-800)", borderRadius: 8, padding: "8px 12px", border: "1px solid var(--border)" }}>
                          <div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", fontWeight: 700, color: "#34d399" }}>
                              {sale.qtySold} unit{sale.qtySold !== 1 ? "s" : ""} @ {fmtMoney(sale.priceSold)} each
                              <span style={{ color: "var(--gold)", marginLeft: 8 }}>= {fmtMoney(sale.qtySold * sale.priceSold)}</span>
                            </div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>
                              {fmtDate(sale.dateSold)}{sale.notes ? ` · ${sale.notes}` : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteSale(sale.id)}
                            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: "0.65rem" }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

      <div className={`toast ${toastVisible ? "show" : ""}`}>{toast}</div>
    </div>
  );
}
