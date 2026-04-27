"use client";

import { useState } from "react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  lead: "#e8c070",
  prospect: "#60a5fa",
  customer: "#34d399",
  churned: "#f87171",
};

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "", position: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    setFormData({ name: "", email: "", phone: "", company: "", position: "" });
    setShowForm(false);
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this customer?")) {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      window.location.reload();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="section-title">Customers <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 400 }}>({customers.length})</span></div>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Customer"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
            {[
              { key: "name", placeholder: "Name", required: true },
              { key: "email", placeholder: "Email", type: "email", required: true },
              { key: "phone", placeholder: "Phone" },
              { key: "company", placeholder: "Company" },
              { key: "position", placeholder: "Position" },
            ].map(({ key, placeholder, type, required }) => (
              <input key={key} className="input" placeholder={placeholder} type={type || "text"} required={required}
                value={formData[key as keyof typeof formData]}
                onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
            ))}
          </div>
          <button type="submit" className="btn" style={{ marginTop: "1rem" }}>Save Customer</button>
        </form>
      )}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Name", "Email", "Company", "Status", "Actions"].map(h => (
                <th key={h} className="table-header" style={{ padding: "11px 16px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map(c => {
              const sc = STATUS_COLORS[c.status] || "#94a3b8";
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td className="table-cell" style={{ fontWeight: 700, color: "var(--cream)" }}>{c.name}</td>
                  <td className="table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem" }}>{c.email}</td>
                  <td className="table-cell">{c.company || "—"}</td>
                  <td className="table-cell">
                    <span className="chip" style={{ background: sc + "18", color: sc, borderColor: sc + "40" }}>{c.status}</span>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => handleDelete(c.id)} className="btn btn-danger" style={{ padding: "4px 12px", fontSize: "0.7rem" }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            No customers yet
          </div>
        )}
      </div>
    </div>
  );
}
