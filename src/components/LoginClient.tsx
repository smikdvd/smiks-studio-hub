"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: err } = await signIn.email({ email, password });
        if (err) { setError(err.message || "Invalid email or password"); setLoading(false); return; }
      } else {
        const { error: err } = await signUp.email({ name, email, password });
        if (err) { setError(err.message || "Could not create account"); setLoading(false); return; }
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 1rem",
            background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
            borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.8rem", boxShadow: "0 4px 20px rgba(212,168,67,0.45)",
          }}>🎙️</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Smiks&apos; Studio Hub
          </div>
          <div style={{ fontSize: "0.6rem", color: "var(--gold)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 4, fontWeight: 600 }}>
            Amplify Your Dreams
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--navy-800)", border: "1px solid var(--border-strong)",
          borderRadius: 16, padding: "2rem", boxShadow: "var(--shadow-lg)",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: "1.75rem", background: "var(--navy-900)", borderRadius: 9, padding: 4 }}>
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "8px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontFamily: "'Montserrat', sans-serif", fontSize: "0.72rem", fontWeight: 800,
                  letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.18s",
                  background: mode === m ? "var(--gold)" : "transparent",
                  color: mode === m ? "var(--navy-900)" : "var(--text-muted)",
                }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {mode === "register" && (
              <label style={{ display: "block" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>
                  Full Name
                </span>
                <input
                  className="input" type="text" required
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              </label>
            )}

            <label style={{ display: "block" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>
                Email Address
              </span>
              <input
                className="input" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label style={{ display: "block" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>
                Password
              </span>
              <input
                className="input" type="password" required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimum 8 characters" : "Your password"}
              />
            </label>

            {error && (
              <div style={{
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 8, padding: "10px 14px", fontSize: "0.78rem",
                color: "#f87171", fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" className="btn" disabled={loading}
              style={{ width: "100%", marginTop: 4, padding: "11px", fontSize: "0.82rem" }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
