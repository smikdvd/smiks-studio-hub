// Run with: bun scripts/seed-expenses.mjs
// Seeds recurring expenses: rent, garbage, electricity, transport, meals

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toDate(y, m, d) {
  // m is 0-based (JS style). Handles overflow (e.g. month=13 → Feb next year)
  return new Date(y, m, d);
}

function fmt(date) {
  return date.toISOString().split("T")[0];
}

async function main() {
  const records = [];

  // ── 1. RENT: 850,000/month, Feb 2025 – Jan 2026 (12 months) ──────────────
  for (let m = 0; m < 12; m++) {
    // new Date(2025, 1+m, 1): Feb=1, Mar=2, ..., Dec=11, Jan2026=12 (JS overflow)
    const d = toDate(2025, 1 + m, 1);
    records.push({
      desc: "Rent",
      category: "Rent",
      amount: 850000,
      date: fmt(d),
      vendor: null,
      payMethod: "Cash",
      notes: null,
    });
  }

  // ── 2. GARBAGE COLLECTION: 25,000/month, Feb 2025 – May 2026 (16 months) ─
  for (let m = 0; m < 16; m++) {
    const d = toDate(2025, 1 + m, 1);
    records.push({
      desc: "Garbage Collection",
      category: "Miscellaneous",
      amount: 25000,
      date: fmt(d),
      vendor: null,
      payMethod: "Cash",
      notes: null,
    });
  }

  // ── 3. ELECTRICITY: 24,000/month, Feb 2025 – May 2026 (16 months) ────────
  for (let m = 0; m < 16; m++) {
    const d = toDate(2025, 1 + m, 1);
    records.push({
      desc: "Electricity",
      category: "Utilities",
      amount: 24000,
      date: fmt(d),
      vendor: null,
      payMethod: "Cash",
      notes: null,
    });
  }

  // ── 4. TRANSPORT: 20,000 every Mon–Sat, Feb 1 2025 – May 2 2026 ──────────
  // JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const dailyStart = new Date(2025, 1, 1);   // Feb 1 2025
  const dailyEnd   = new Date(2026, 4, 2);   // May 2 2026

  for (let cur = new Date(dailyStart); cur <= dailyEnd; cur.setDate(cur.getDate() + 1)) {
    if (cur.getDay() !== 0) { // not Sunday
      records.push({
        desc: "Transport",
        category: "Transport",
        amount: 20000,
        date: fmt(new Date(cur)),
        vendor: null,
        payMethod: "Cash",
        notes: null,
      });
    }
  }

  // ── 5. MEALS: 15,000 every day, Feb 1 2025 – May 2 2026 ─────────────────
  for (let cur = new Date(dailyStart); cur <= dailyEnd; cur.setDate(cur.getDate() + 1)) {
    records.push({
      desc: "Meals",
      category: "Miscellaneous",
      amount: 15000,
      date: fmt(new Date(cur)),
      vendor: null,
      payMethod: "Cash",
      notes: null,
    });
  }

  console.log(`Preparing to insert ${records.length} expense records…`);

  // Insert in batches of 500 to avoid query size limits
  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const result = await prisma.expense.createMany({ data: batch });
    inserted += result.count;
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}: inserted ${result.count} (total so far: ${inserted})`);
  }

  console.log(`\n✓ Done. Inserted ${inserted} expense records total.`);

  // Summary
  const summary = {};
  for (const r of records) {
    summary[r.desc] = (summary[r.desc] || 0) + r.amount;
  }
  console.log("\nBreakdown:");
  for (const [name, total] of Object.entries(summary)) {
    console.log(`  ${name}: USh ${total.toLocaleString()}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
