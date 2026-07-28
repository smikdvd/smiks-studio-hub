"use client";

import { useState } from "react";

interface Deal {
  id: number;
  title: string;
  value: number;
  stage: string;
  customer?: { name: string };
}

interface Customer {
  id: number;
  name: string;
}

const STAGE_COLORS: Record<string, string> = {
  new: "#94a3b8",
  qualified: "#60a5fa",
  proposal: "#e8c070",
  negotiation: "#fb923c",
  closed: "#34d399",
};

export default function DealsClient({ deals, customers }: { deals: Deal[]; customers: Customer[] }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", value: "", customerId: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/deals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formData.title, value: parseFloat(formData.value), customerId: parseInt(formData.customerId) }),
    });
    setFormData({ title: "", value: "", customerId: "" });
    setShowForm(false);
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this deal?")) {
      await fetch(`/api/deals/${id}`, { method: "DELETE" });
      window.location.reload();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="section-title">Deals <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 400 }}>({deals.length})</span></div>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Deal"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.9rem" }}>
            <input className="input" placeholder="Deal Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            <input className="input" placeholder="Value" type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} required />
            <select className="input" value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} required>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn" style={{ marginTop: "1rem" }}>Save Deal</button>
        </form>
      )}

      <div className="g3">
        {deals.map(deal => {
          const sc = STAGE_COLORS[deal.stage] || "#94a3b8";
          return (
            <div key={deal.id} className="card" style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h3 style={{ fontWeight: 700, color: "var(--cream)", fontSize: "0.95rem" }}>{deal.title}</h3>
                <button onClick={() => handleDelete(deal.id)} className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "0.65rem" }}>Delete</button>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 700, color: "var(--gold-light)", marginBottom: 6 }}>
                USh {deal.value.toLocaleString()}
              </div>
              {deal.customer && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 8 }}>{deal.customer.name}</div>}
              <span className="chip" style={{ background: sc + "18", color: sc, borderColor: sc + "40" }}>{deal.stage}</span>
            </div>
          );
        })}
      </div>
      {deals.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          No deals yet
        </div>
      )}
    </div>
  );
}
