"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

export default function NavAuthButton() {
  const router = useRouter();
  const { data: session } = useSession();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  if (!session) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <a href="/account" style={{
        display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
        background: "var(--surface)", border: "1px solid var(--border-strong)",
        borderRadius: 8, padding: "5px 10px", transition: "all 0.18s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
      >
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), var(--gold-dark))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 900, color: "var(--navy-900)", flexShrink: 0 }}>
          {(session.user.name || session.user.email).charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {session.user.name || session.user.email}
        </div>
      </a>
      <button
        onClick={handleSignOut}
        style={{
          background: "var(--surface)", border: "1px solid var(--border-strong)",
          color: "var(--text-muted)", borderRadius: 7, padding: "6px 12px",
          fontFamily: "'Montserrat', sans-serif", fontSize: "0.68rem", fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
          transition: "all 0.18s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "#f87171";
          (e.currentTarget as HTMLElement).style.color = "#f87171";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
