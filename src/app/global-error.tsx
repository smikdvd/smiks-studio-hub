"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html>
      <body style={{ background: "#0d1b2e", fontFamily: "sans-serif", margin: 0 }}>
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "1.5rem",
          padding: "2rem", textAlign: "center", color: "#f5ead6",
        }}>
          <div style={{ fontSize: "2.5rem" }}>⚠️</div>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 8 }}>
              Something went wrong
            </div>
            <div style={{ fontSize: "0.82rem", color: "rgba(245,234,214,0.5)", maxWidth: 380 }}>
              The database may be waking up from sleep. This usually resolves in a few seconds.
            </div>
          </div>
          <button
            onClick={reset}
            style={{
              background: "#d4a843", color: "#0d1b2e", border: "none",
              borderRadius: 8, padding: "10px 28px", fontSize: "0.9rem",
              fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
            }}
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
