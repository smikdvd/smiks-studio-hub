"use client";

import { useState } from "react";

interface StudioSession {
  id: number;
  client: string;
  type: string;
  date: string | null;
  hours: number;
  rate: number;
  discount: number;
  netRevenue: number;
  payStatus: string;
  notes: string | null;
}

const SESSION_TYPES = ["Recording Session", "Podcast Recording", "Livestream", "Mixing", "Mastering", "Consultation", "Rehearsal"];
const PAY_STATUSES = ["Paid", "Pending", "Partial", "Refunded", "Cancelled"];

const PAY_COLORS: Record<string, string> = {
  "Paid": "#34d399",
  "Pending": "#e8c070",
  "Partial": "#60a5fa",
  "Refunded": "#fb923c",
  "Cancelled": "#f87171",
};

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function fmtMoney(v: number) {
  if (!v) return "USh 0";
  return "USh " + Number(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function StatusChip({ status }: { status: string }) {
  const c = PAY_COLORS[status] || "#94a3b8";
  return <span className="chip" style={{ background: c + "18", color: c, borderColor: c + "40" }}>{status}</span>;
}

const EMPTY_FORM = { client: "", type: "Recording Session", date: "", hours: "", rate: "", discount: "0", netRevenue: "", payStatus: "Pending", notes: "" };

export default function SessionsClient({ sessions: initial }: { sessions: StudioSession[] }) {
  const [sessions, setSessions] = useState(initial);
  const [modal, setModal] = useState<StudioSession | "new" | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  function showToast(msg: string) {
    setToast(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  function openAdd() { setForm({ ...EMPTY_FORM }); setModal("new"); }
  function openEdit(s: StudioSession) {
    setForm({ client: s.client, type: s.type, date: s.date || "", hours: String(s.hours || ""), rate: String(s.rate || ""), discount: String(s.discount || 0), netRevenue: String(s.netRevenue || ""), payStatus: s.payStatus, notes: s.notes || "" });
    setModal(s);
  }

  async function save() {
    if (!form.client.trim()) { showToast("Client name is required"); return; }
    const payload = {
      client: form.client.trim(),
      type: form.type,
      date: form.date || null,
      hours: parseFloat(form.hours) || 0,
      rate: parseFloat(form.rate) || 0,
      discount: parseFloat(form.discount) || 0,
      netRevenue: parseFloat(form.netRevenue) || 0,
      payStatus: form.payStatus,
      notes: form.notes.trim() || null,
    };
    if (modal === "new") {
      const res = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const created = await res.json();
      setSessions(prev => [created, ...prev]);
      showToast("Session saved!");
    } else if (modal && typeof modal === "object") {
      await fetch(`/api/sessions/${modal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setSessions(prev => prev.map(s => s.id === modal.id ? { ...s, ...payload } : s));
      showToast("Session updated!");
    }
    setModal(null);
  }

  async function deleteSession() {
    if (!modal || modal === "new" || typeof modal !== "object") return;
    if (!confirm("Delete session?")) return;
    await fetch(`/api/sessions/${modal.id}`, { method: "DELETE" });
    setSessions(prev => prev.filter(s => s.id !== modal.id));
    setModal(null);
    showToast("Session deleted");
  }

  const f = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const totalRevenue = sessions.filter(s => s.payStatus === "Paid").reduce((a, s) => a + s.netRevenue, 0);
  const pendingCount = sessions.filter(s => s.payStatus === "Pending").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="section-title">Sessions &amp; Bookings</div>
        <button className="add-btn" onClick={openAdd}>+ Add Session</button>
      </div>

      {/* KPIs */}
      <div className="g3" style={{ marginBottom: "1.5rem" }}>
        <div className="kpi-card accent2">
          <div className="kpi-label">Total Sessions</div>
          <div className="kpi-value">{sessions.length}</div>
        </div>
        <div className="kpi-card accent1">
          <div className="kpi-label">Total Revenue</div>
          <div className="kpi-value">{fmtMoney(totalRevenue)}</div>
        </div>
        <div className="kpi-card accent4">
          <div className="kpi-label">Pending Payments</div>
          <div className="kpi-value">{pendingCount}</div>
        </div>
      </div>

      {/* Session Cards */}
      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          No sessions yet. Add your first booking!
        </div>
      ) : (
        <div className="g3">
          {sessions.map(s => (
            <div key={s.id} onClick={() => openEdit(s)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.2rem", cursor: "pointer", transition: "all 0.2s", boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>{s.type}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: 4, color: "var(--cream)", textTransform: "uppercase" }}>{s.client}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.67rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {fmtDate(s.date)} · {s.hours}hrs @ USh {Number(s.rate).toLocaleString()}/hr
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.15rem", fontWeight: 700, color: "#34d399" }}>{fmtMoney(s.netRevenue)}</div>
                <StatusChip status={s.payStatus} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--navy-900)", borderRadius: "16px 16px 0 0" }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--cream)", textTransform: "uppercase" }}>{modal === "new" ? "Add Session" : "Edit Session"}</div>
              <button onClick={() => setModal(null)} style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text-muted)", cursor: "pointer", padding: "6px 10px", borderRadius: 7 }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Client Name</span>
                  <input className="input" value={form.client} onChange={f("client")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Service Type</span>
                  <select className="input" value={form.type} onChange={f("type")}>
                    {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Date</span>
                  <input className="input" type="date" value={form.date} onChange={f("date")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Hours</span>
                  <input className="input" type="number" step="0.5" value={form.hours} onChange={f("hours")} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Rate/Hr ($)</span>
                  <input className="input" type="number" step="0.01" value={form.rate} onChange={f("rate")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Discount ($)</span>
                  <input className="input" type="number" step="0.01" value={form.discount} onChange={f("discount")} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.9rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Net Revenue ($)</span>
                  <input className="input" type="number" step="0.01" value={form.netRevenue} onChange={f("netRevenue")} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>Payment Status</span>
                  <select className="input" value={form.payStatus} onChange={f("payStatus")}>
                    {PAY_STATUSES.map(p => <option key={p}>{p}</option>)}
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
                <button className="btn btn-danger" onClick={deleteSession} style={{ marginRight: "auto" }}>Delete</button>
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
