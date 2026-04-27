"use client";

import { useState } from "react";

interface Task {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  customer: { name: string } | null;
}

interface Customer {
  id: number;
  name: string;
}

export default function TasksClient({ tasks, customers }: { tasks: Task[]; customers: Customer[] }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", dueDate: "", customerId: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formData.title, description: formData.description, dueDate: formData.dueDate, customerId: formData.customerId ? parseInt(formData.customerId) : null }),
    });
    setFormData({ title: "", description: "", dueDate: "", customerId: "" });
    setShowForm(false);
    window.location.reload();
  };

  const toggleComplete = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !task.completed }) });
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this task?")) {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      window.location.reload();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div className="section-title">Tasks <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 400 }}>({tasks.length})</span></div>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Task"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
            <input className="input" placeholder="Task Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            <input className="input" type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
            <input className="input" placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ gridColumn: "1 / -1" }} />
            <select className="input" value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
              <option value="">No Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn" style={{ marginTop: "1rem" }}>Save Task</button>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map(task => (
          <div key={task.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", opacity: task.completed ? 0.6 : 1 }}>
            <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task)}
              style={{ width: 18, height: 18, accentColor: "var(--gold)", cursor: "pointer", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--cream)", textDecoration: task.completed ? "line-through" : "none", fontSize: "0.9rem" }}>{task.title}</div>
              {task.description && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{task.description}</div>}
              <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                {task.customer && <span>👤 {task.customer.name}</span>}
                {task.dueDate && <span>📅 {task.dueDate}</span>}
              </div>
            </div>
            <button onClick={() => handleDelete(task.id)} className="btn btn-danger" style={{ padding: "4px 12px", fontSize: "0.7rem", flexShrink: 0 }}>Delete</button>
          </div>
        ))}
      </div>
      {tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          No tasks yet
        </div>
      )}
    </div>
  );
}
