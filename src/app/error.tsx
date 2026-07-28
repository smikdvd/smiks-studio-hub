"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1.5rem",
      padding: "2rem", textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
      }}>⚠️</div>
      <div>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--cream)", marginBottom: 8 }}>
          Something went wrong
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 380 }}>
          The database may be waking up from sleep. This usually resolves in a few seconds.
        </div>
      </div>
      <button
        onClick={reset}
        className="btn"
        style={{ padding: "10px 28px", fontSize: "0.85rem" }}
      >
        Reload Page
      </button>
    </div>
  );
}
