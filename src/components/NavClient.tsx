"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/deals", label: "Deals" },
  { href: "/tasks", label: "Tasks" },
  { href: "/inventory", label: "Inventory" },
  { href: "/sessions", label: "Sessions" },
  { href: "/expenses", label: "Expenses" },
  { href: "/reports", label: "Reports" },
  { href: "/invoices", label: "Invoices" },
];

export default function NavClient() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop nav */}
      <nav className="nav-desktop" style={{ display: "flex", gap: "3px", alignItems: "center" }}>
        {NAV_LINKS.map(l => (
          <Link key={l.href} href={l.href} className={`nav-link ${isActive(l.href) ? "active" : ""}`}>
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <button
        className="nav-mobile-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span style={{ transform: open ? "rotate(45deg) translate(4px, 4px)" : "" }} />
        <span style={{ opacity: open ? 0 : 1, transform: open ? "scaleX(0)" : "" }} />
        <span style={{ transform: open ? "rotate(-45deg) translate(4px, -4px)" : "" }} />
      </button>

      {/* Mobile drawer */}
      <div className={`nav-drawer ${open ? "open" : ""}`}>
        {NAV_LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link ${isActive(l.href) ? "active" : ""}`}
            onClick={() => setOpen(false)}
            style={{ fontSize: "0.85rem", padding: "10px 16px" }}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: "64px 0 0 0", zIndex: 98, background: "rgba(0,0,0,0.4)" }}
        />
      )}
    </>
  );
}
