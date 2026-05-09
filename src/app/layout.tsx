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
          background: "var(--canvas)",
          borderBottom: "1px solid var(--border)",
          padding: "0 2rem",
          position: "sticky", top: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "56px",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: "26px", height: "26px",
              background: "var(--gold)",
              borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.8rem",
            }}>🎙️</div>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}>Smiks&apos; Studio Hub</span>
          </Link>

          <nav style={{ display: "flex", gap: "2px" }}>
            <Link href="/" className="nav-link">Dashboard</Link>
            <Link href="/customers" className="nav-link">Customers</Link>
            <Link href="/deals" className="nav-link">Deals</Link>
            <Link href="/tasks" className="nav-link">Tasks</Link>
            <Link href="/inventory" className="nav-link">Inventory</Link>
            <Link href="/sessions" className="nav-link">Sessions</Link>
            <Link href="/expenses" className="nav-link">Expenses</Link>
          </nav>
        </header>

        <main style={{
          flex: 1,
          padding: "2rem",
          maxWidth: "1440px",
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
