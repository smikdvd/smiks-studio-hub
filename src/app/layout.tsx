import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smiks' Studio Hub",
  description: "Studio Business Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <header style={{
          background: "var(--navy-900)",
          borderBottom: "1px solid var(--border-strong)",
          padding: "0 2rem",
          position: "sticky", top: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "64px",
          boxShadow: "0 2px 24px rgba(0,0,0,0.5)",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "14px", textDecoration: "none" }}>
            <div style={{
              width: "40px", height: "40px",
              background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem",
              boxShadow: "0 2px 12px rgba(212,168,67,0.4)",
              flexShrink: 0,
            }}>🎙️</div>
            <div>
              <div style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "0.95rem", fontWeight: 900,
                color: "var(--cream)", letterSpacing: "0.04em",
                textTransform: "uppercase", lineHeight: 1,
              }}>Smiks&apos; Studio Hub</div>
              <div style={{
                fontSize: "0.55rem", color: "var(--gold)",
                letterSpacing: "0.15em", textTransform: "uppercase",
                marginTop: "2px", fontWeight: 600,
              }}>Amplify Your Dreams</div>
            </div>
          </Link>
          <nav style={{ display: "flex", gap: "3px" }}>
            <Link href="/" className="nav-link">Dashboard</Link>
            <Link href="/customers" className="nav-link">Customers</Link>
            <Link href="/deals" className="nav-link">Deals</Link>
            <Link href="/tasks" className="nav-link">Tasks</Link>
            <Link href="/inventory" className="nav-link">Inventory</Link>
            <Link href="/sessions" className="nav-link">Sessions</Link>
            <Link href="/expenses" className="nav-link">Expenses</Link>
          </nav>
        </header>
        <main style={{ flex: 1, padding: "2rem", maxWidth: "1600px", margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
