import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import NavAuthButton from "@/components/NavAuthButton";
import NavClient from "@/components/NavClient";

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
          height: "72px",
          boxShadow: "0 2px 24px rgba(0,0,0,0.5)",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <Image
              src="/logo.jpg"
              alt="Smiks' Studio Hub"
              width={120}
              height={86}
              priority
              style={{ height: "62px", width: "auto", display: "block" }}
            />
          </Link>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <NavClient />
            <div style={{ width: 1, height: 20, background: "var(--border-strong)", margin: "0 4px" }} />
            <NavAuthButton />
          </div>
        </header>
        <main style={{ flex: 1, padding: "2rem", maxWidth: "1600px", margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
