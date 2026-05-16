// Run with: DATABASE_URL="<direct_url>" bun scripts/seed-receipts.mjs
// Seeds inventory items from physical receipt book (receipts 004–100)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_ArlOHZe70ivu@ep-patient-unit-aeilmqdu.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require",
});

// Helper: "⚠️ ILLEGIBLE" flag goes into notes for hard-to-read receipts
// These rows will be highlighted red in the UI
const ILLEGIBLE = "⚠️ ILLEGIBLE";

const receipts = [
  // ── RECEIPT 004 ──
  { receiptNo: "RCP-004", date: "2025-03-21", customer: "D'Vibes Band",
    name: "Behringer Xair XR18 Mixer", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 2000000, notes: "Balance: 800,000 remaining. Customer: D'Vibes Band" },

  // ── RECEIPT 006 ──
  { receiptNo: "RCP-006", date: "2025-02-22", customer: "Canaan Sites Ltd",
    name: "M-Audio Oxygen Pro 49", brand: "M-Audio", category: "Recording",
    priceSold: 1200000, notes: "Customer: Canaan Sites Ltd" },

  // ── RECEIPT 007 ──
  { receiptNo: "RCP-007", date: "2025-03-22", customer: "Canaan Sites Ltd",
    name: "Behringer HPS2000 Headphones", brand: "Behringer", category: "Accessories",
    priceSold: 150000, notes: "Customer: Canaan Sites Ltd" },

  // ── RECEIPT 008 ──
  { receiptNo: "RCP-008", date: "2025-03-25", customer: "Lukoago Abdul (AKA Censor Signal)",
    name: "AKG P420 Microphone", brand: "AKG", category: "Recording",
    priceSold: 540000, notes: "DEPOSIT - Balance: 410,000. Customer: Lukoago Abdul (Censor Signal)" },

  // ── RECEIPT 009 ──
  { receiptNo: "RCP-009", date: "2025-03-27", customer: "Fenon Entertainment",
    name: "Fduce SL40x Podcast Microphone + Stand", brand: "Fduce", category: "Podcast",
    priceSold: 620000, notes: "Customer: Fenon Entertainment" },

  // ── RECEIPT 011 ──
  { receiptNo: "RCP-011", date: "2025-03-31", customer: "Phona",
    name: "Soundpeats Space Wireless Headset", brand: "Soundpeats", category: "Accessories",
    priceSold: 230000, notes: "Customer: Phona" },

  // ── RECEIPT 012 — customer name illegible ──
  { receiptNo: "RCP-012", date: "2025-04-02", customer: "Miss [?]",
    name: "Apollo Twin X Interface", brand: "Universal Audio", category: "Recording",
    priceSold: 3500000, notes: `${ILLEGIBLE} - Customer name unclear. Receipt 012.` },

  // ── RECEIPT 013 ──
  { receiptNo: "RCP-013", date: "2025-04-04", customer: "Mr. Joshua",
    name: "Rode NT1-A Microphone", brand: "Rode", category: "Recording",
    priceSold: 1300000, notes: "Customer: Mr. Joshua" },

  // ── RECEIPT 014 ──
  { receiptNo: "RCP-014", date: "2025-04-07", customer: "Assad Ssemango",
    name: "Beyerdynamic DT990 Pro Headphones", brand: "Beyerdynamic", category: "Accessories",
    priceSold: 850000, notes: "Customer: Assad Ssemango" },

  // ── RECEIPT 015 ──
  { receiptNo: "RCP-015", date: "2025-04-07", customer: "Assad Ssemango",
    name: "Behringer HA400 Headphone Amplifier", brand: "Behringer", category: "Accessories",
    priceSold: 300000, notes: "Customer: Assad Ssemango" },

  // ── RECEIPT 016 ──
  { receiptNo: "RCP-016", date: "2025-04-07", customer: "Bukenya Gilbert",
    name: "Apple M1 Mac Mini 512GB (SN: C0TJC0US0B6NW)", brand: "Apple", category: "Other",
    priceSold: 3800000, notes: "Customer: Bukenya Gilbert" },

  // ── RECEIPT 018 ──
  { receiptNo: "RCP-018", date: "2025-04-07", customer: "Bukenya Gilbert",
    name: "Setachi SSD Expansion Drive", brand: "Setachi", category: "Other",
    priceSold: 480000, notes: "Customer: Bukenya Gilbert" },

  // ── RECEIPT 019 ──
  { receiptNo: "RCP-019", date: "2025-04-07", customer: "Bukenya Gilbert",
    name: "1TB SSD Hard Drive", brand: "", category: "Other",
    priceSold: 400000, notes: "Customer: Bukenya Gilbert" },

  // ── RECEIPT 020 ──
  { receiptNo: "RCP-020", date: "2025-04-08", customer: "CRY",
    name: "Audio-Technica AT2020 Microphone", brand: "Audio-Technica", category: "Recording",
    priceSold: 650000, notes: "Customer: CRY" },

  // ── RECEIPT 021 ──
  { receiptNo: "RCP-021", date: "2025-04-09", customer: "Mr. Lakor Emmy",
    name: "Behringer XR18 Digital Mixer", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 3500000, notes: "Customer: Mr. Lakor Emmy" },

  // ── RECEIPT 023 ──
  { receiptNo: "RCP-023", date: "2025-04-14", customer: "Alpha Stella",
    name: "KZ EDX Pro X IEM", brand: "KZ", category: "Accessories",
    priceSold: 200000, notes: "Customer: Alpha Stella" },

  // ── RECEIPT 024 ──
  { receiptNo: "RCP-024", date: "2025-04-14", customer: "Bibo",
    name: "KZ Castor IEM", brand: "KZ", category: "Accessories",
    priceSold: 150000, notes: "Customer: Bibo" },

  // ── RECEIPT 025 ──
  { receiptNo: "RCP-025", date: "2025-04-15", customer: "Springs of Healing",
    name: "Behringer XR18 Mixer", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 2800000, notes: "Customer: Springs of Healing" },

  // ── RECEIPT 026 ──
  { receiptNo: "RCP-026", date: "2025-04-17", customer: "Willis",
    name: "Behringer UMC22 Audio Interface", brand: "Behringer", category: "Recording",
    priceSold: 450000, notes: "Customer: Willis" },

  // ── RECEIPT 027 ──
  { receiptNo: "RCP-027", date: "2025-04-17", customer: "Ssempagala Derrick",
    name: "Genelec 1020B Studio Monitor (SN: 40203WM71004817)", brand: "Genelec", category: "Mixing & Mastering",
    priceSold: 3300000, notes: "Customer: Ssempagala Derrick" },

  // ── RECEIPT 028 ──
  { receiptNo: "RCP-028", date: "2025-04-26", customer: "Martin Isabirye",
    name: "Behringer Xair XR16 Digital Mixer", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 2300000, notes: "Customer: Martin Isabirye" },

  // ── RECEIPT 029 ──
  { receiptNo: "RCP-029", date: "2025-04-28", customer: "Donnie Pro",
    name: "NUX MG-101 Effects Pedal", brand: "NUX", category: "Other",
    priceSold: 650000, notes: "Customer: Donnie Pro" },

  // ── RECEIPT 030 — item description partially illegible ──
  { receiptNo: "RCP-030", date: "2025-04-28", customer: "Abdu Hayat Kajobe",
    name: "M-Audio Oxygen 212 Bundle + Go Vocal [?]", brand: "M-Audio", category: "Recording",
    priceSold: 3150000, notes: `${ILLEGIBLE} - Item description partially unclear. Customer: Abdu Hayat Kajobe` },

  // ── RECEIPT 031 ──
  { receiptNo: "RCP-031", date: "2025-04-29", customer: "Seth Kwete",
    name: "Behringer XR18 Digital Mixer", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 3000000, notes: "Customer: Seth Kwete" },

  // ── RECEIPT 032 ──
  { receiptNo: "RCP-032", date: "2025-04-29", customer: "VTim",
    name: "Akai MPK Mini MKIII", brand: "Akai", category: "Recording",
    priceSold: 680000, notes: "Customer: VTim" },

  // ── RECEIPT 033 ──
  { receiptNo: "RCP-033", date: "2025-05-05", customer: "Kampala Bible Revelation Church",
    name: "Beyerdynamic DT990 Headphones", brand: "Beyerdynamic", category: "Accessories",
    priceSold: 850000, notes: "Customer: Kampala Bible Revelation Church" },

  // ── RECEIPT 034 — item description illegible ──
  { receiptNo: "RCP-034", date: "2025-06-05", customer: "David Elijah Watisa (Rapha Music)",
    name: "Alesis Vita + Presonus Bundle + Macbook [?]", brand: "Various", category: "Other",
    priceSold: 2780000, notes: `${ILLEGIBLE} - Multiple items, description unclear. Customer: David Elijah Watisa (Rapha Music)` },

  // ── RECEIPT 035 — price in USD ──
  { receiptNo: "RCP-035", date: "2025-05-10", customer: "Ngong Max",
    name: "Technics [?] Keyboard", brand: "[?]", category: "Other",
    priceSold: 1800, notes: `${ILLEGIBLE} - Price was $1,800 USD. Brand/model unclear. Customer: Ngong Max` },

  // ── RECEIPT 036 ──
  { receiptNo: "RCP-036", date: "2025-05-12", customer: "Silas Producer",
    name: "M-Audio Keystation 49 MIDI", brand: "M-Audio", category: "Recording",
    priceSold: 650000, notes: "Customer: Silas Producer" },

  // ── RECEIPT 037 — brand/item partially illegible ──
  { receiptNo: "RCP-037", date: "2025-05-16", customer: "Pius Juuko",
    name: "Acalla [?] Duo Wireless Lapel System", brand: "[?]", category: "Podcast",
    priceSold: 600000, notes: `${ILLEGIBLE} - Brand/model unclear. Balance: 160,000. Customer: Pius Juuko` },

  // ── RECEIPT 038 — item model unclear ──
  { receiptNo: "RCP-038", date: "2025-05-22", customer: "Ronald Lusembo",
    name: "Presonus [?] (SN: UG8A22181634)", brand: "Presonus", category: "Recording",
    priceSold: 430000, notes: `${ILLEGIBLE} - Model number unclear. Customer: Ronald Lusembo` },

  // ── RECEIPT 040 ──
  { receiptNo: "RCP-040", date: "2025-05-28", customer: "Bizihanna Theo",
    name: "Rode Podcaster Pair", brand: "Rode", category: "Podcast",
    priceSold: 1200000, notes: "Customer: Bizihanna Theo" },

  // ── RECEIPT 041 ──
  { receiptNo: "RCP-041", date: "2025-05-31", customer: "Mr. Emmanuel Sekumba",
    name: "Behringer UMC22 Sound Card", brand: "Behringer", category: "Recording",
    priceSold: 850000, notes: "DEPOSIT - Balance: 150,000. Customer: Mr. Emmanuel Sekumba" },

  // ── RECEIPT 042 ──
  { receiptNo: "RCP-042", date: "2025-06-02", customer: "Emmanuel / Word Gospel Ministries",
    name: "Tascam X8 PortaCapture Recorder", brand: "Tascam", category: "Recording",
    priceSold: 1000000, notes: "DEPOSIT - Balance: 500,000. Customer: Emmanuel / Word Gospel Ministries" },

  // ── RECEIPT 043 ──
  { receiptNo: "RCP-043", date: "2025-06-02", customer: "Grace Overflow Church",
    name: "Focusrite Scarlett 2i2 (SN: S28CP6E3AH9DE)", brand: "Focusrite", category: "Recording",
    priceSold: 1500000, notes: "Customer: Grace Overflow Church" },

  // ── RECEIPT 044 — second item unclear ──
  { receiptNo: "RCP-044", date: "2025-06-07", customer: "Tibulya",
    name: "Fduce SL40x + DUE [?]", brand: "Fduce", category: "Podcast",
    priceSold: 600000, notes: `${ILLEGIBLE} - Second item in bundle unclear. Customer: Tibulya` },

  // ── RECEIPT 045 ──
  { receiptNo: "RCP-045", date: "2025-06-09", customer: "Tibulya",
    name: "Behringer UMC204HD Interface", brand: "Behringer", category: "Recording",
    priceSold: 700000, notes: "Customer: Tibulya" },

  // ── RECEIPT 047 — price in USD ──
  { receiptNo: "RCP-047", date: "2025-06-10", customer: "Christopher",
    name: "Behringer C1 Microphone", brand: "Behringer", category: "Recording",
    priceSold: 100, notes: "Price was $100 USD. Customer: Christopher" },

  // ── RECEIPT 048 ──
  { receiptNo: "RCP-048", date: "2025-05-19", customer: "Joe Kicezi",
    name: "Osee Go Stream Dual Switch", brand: "Osee", category: "Livestreaming",
    priceSold: 1700000, notes: "Balance: 1,025,000 payable 1 week. Customer: Joe Kicezi" },

  // ── RECEIPT 049 ──
  { receiptNo: "RCP-049", date: "2025-06-14", customer: "Hannington",
    name: "Alesis iO4 Interface", brand: "Alesis", category: "Recording",
    priceSold: 400000, notes: "Customer: Hannington" },

  // ── RECEIPT 050 ──
  { receiptNo: "RCP-050", date: "2025-06-19", customer: "Producer Ricky (Ssembujo Fredrick)",
    name: "Focusrite Scarlett 2i2 Interface", brand: "Focusrite", category: "Recording",
    priceSold: 900000, notes: "Customer: Producer Ricky (Ssembujo Fredrick)" },

  // ── RECEIPT 051 — no date on receipt ──
  { receiptNo: "RCP-051", date: null, customer: "Producer Dicky Ssango Hendrix",
    name: "Focusrite 2i2 Interface", brand: "Focusrite", category: "Recording",
    priceSold: 1200000, notes: "Customer: Producer Dicky Ssango Hendrix. Date missing on receipt." },

  // ── RECEIPT 052 — deposit ──
  { receiptNo: "RCP-052", date: "2025-06-19", customer: "Emmanuel / Word Gospel Ministries (Word Fredrick)",
    name: "Behringer XR16 Mixer", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 350000, notes: "DEPOSIT - Balance: 2,150,000. Customer: Emmanuel / Word Gospel Ministries" },

  // ── RECEIPT 053 ──
  { receiptNo: "RCP-053", date: "2025-06-21", customer: "Oscar Ntege",
    name: "Behringer HPS2000 Headphones", brand: "Behringer", category: "Accessories",
    priceSold: 240000, notes: "Customer: Oscar Ntege" },

  // ── RECEIPT 054 — item model unclear ──
  { receiptNo: "RCP-054", date: "2025-06-21", customer: "Oscar Ntege",
    name: "Presonus [?] Interface", brand: "Presonus", category: "Recording",
    priceSold: 260000, notes: `${ILLEGIBLE} - DEPOSIT, balance 490,000. Model unclear. Customer: Oscar Ntege` },

  // ── RECEIPT 055 — items partially illegible ──
  { receiptNo: "RCP-055", date: "2025-06-27", customer: "Bahati",
    name: "Focusrite 2i4 + Fduce SL40x Mic [?]", brand: "Various", category: "Recording",
    priceSold: 1000000, notes: `${ILLEGIBLE} - Balance: 750,000. Bundle items unclear. Customer: Bahati` },

  // ── RECEIPT 056 ──
  { receiptNo: "RCP-056", date: "2025-07-02", customer: "Christopher",
    name: "Behringer UMC22 Audio Interface", brand: "Behringer", category: "Recording",
    priceSold: 400000, notes: "Customer: Christopher" },

  // ── RECEIPT 057 — item name completely missing ──
  { receiptNo: "RCP-057", date: "2025-07-03", customer: "Patrick",
    name: "[Item not written on receipt]", brand: "[?]", category: "Other",
    priceSold: 1800000, notes: `${ILLEGIBLE} - Item description was left blank. Customer: Patrick` },

  // ── RECEIPT 058 ──
  { receiptNo: "RCP-058", date: "2025-07-04", customer: "Gideon Mbolamberi",
    name: "Focal CMS65 Studio Monitors", brand: "Focal", category: "Mixing & Mastering",
    priceSold: 3700000, notes: "Customer: Gideon Mbolamberi" },

  // ── RECEIPT 059 ──
  { receiptNo: "RCP-059", date: "2025-07-11", customer: "Mayaja Moses",
    name: "Behringer UMC22 Interface", brand: "Behringer", category: "Recording",
    priceSold: 400000, notes: "Customer: Mayaja Moses" },

  // ── RECEIPT 060 ──
  { receiptNo: "RCP-060", date: "2025-06-16", customer: "Hussein",
    name: "Zoom PodTrak 4 + Shure SV100 + 5x XLR Connectors", brand: "Various", category: "Podcast",
    priceSold: 1125000, notes: "Customer: Hussein" },

  // ── RECEIPT 061 ──
  { receiptNo: "RCP-061", date: "2025-07-22", customer: "Mulinka Martin",
    name: "Behringer C1 Studio Microphone", brand: "Behringer", category: "Recording",
    priceSold: 450000, notes: "Customer: Mulinka Martin" },

  // ── RECEIPT 062 ──
  { receiptNo: "RCP-062", date: "2025-07-25", customer: "Mr. Eliezer Kwete",
    name: "Behringer XR18 Mixer", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 3000000, notes: "Customer: Mr. Eliezer Kwete" },

  // ── RECEIPT 063 ──
  { receiptNo: "RCP-063", date: "2025-07-25", customer: "Moses Kakule",
    name: "Behringer XR16 Mixer", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 2300000, notes: "Customer: Moses Kakule" },

  // ── RECEIPT 064 — amount mismatch ──
  { receiptNo: "RCP-064", date: "2025-07-25", customer: "Abdu Hayate",
    name: "Behringer XR16 Monitor [?]", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 2800000, notes: `${ILLEGIBLE} - Amount mismatch on receipt (words say 400k, box says 2,800,000). Customer: Abdu Hayate` },

  // ── RECEIPT 065 ──
  { receiptNo: "RCP-065", date: "2025-07-27", customer: "Tumwesigton Bruce",
    name: "Yamaha HS5 Speakers (pair) + 2i2 Bundle", brand: "Yamaha", category: "Mixing & Mastering",
    priceSold: 3900000, notes: "Customer: Tumwesigton Bruce" },

  // ── RECEIPT 066 ──
  { receiptNo: "RCP-066", date: "2025-07-27", customer: "Michael Kutos",
    name: "Behringer C2 Microphone", brand: "Behringer", category: "Recording",
    priceSold: 600000, notes: "Customer: Michael Kutos" },

  // ── RECEIPT 067 — customer name illegible ──
  { receiptNo: "RCP-067", date: "2025-07-28", customer: "[Name unclear]",
    name: "PYLE Studio Monitor Stands (pair)", brand: "PYLE", category: "Accessories",
    priceSold: 750000, notes: `${ILLEGIBLE} - Customer name unreadable. Balance: 50,000. Receipt 067.` },

  // ── RECEIPT 068 ──
  { receiptNo: "RCP-068", date: "2025-07-31", customer: "Arafa",
    name: "Behringer UMC2 Interface", brand: "Behringer", category: "Recording",
    priceSold: 350000, notes: "Customer: Arafa" },

  // ── RECEIPT 069 — item very unclear ──
  { receiptNo: "RCP-069", date: "2025-07-31", customer: "Adam",
    name: "IRQ [?]", brand: "[?]", category: "Other",
    priceSold: 50000, notes: `${ILLEGIBLE} - Item name completely unclear. Customer: Adam` },

  // ── RECEIPT 070 ──
  { receiptNo: "RCP-070", date: "2025-08-02", customer: "St Barnabas Church Uganda",
    name: "Behringer XR18 Mixer (SN: S250400289B18)", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 3000000, notes: "Balance: 500,000. Customer: St Barnabas Church Uganda" },

  // ── RECEIPT 071 ──
  { receiptNo: "RCP-071", date: "2025-08-02", customer: "Emma",
    name: "Behringer UMC22 Interface", brand: "Behringer", category: "Recording",
    priceSold: 500000, notes: "Customer: Emma" },

  // ── RECEIPT 072 ──
  { receiptNo: "RCP-072", date: "2025-08-04", customer: "Nicholas",
    name: "AKG K92 Headphones", brand: "AKG", category: "Accessories",
    priceSold: 400000, notes: "Customer: Nicholas" },

  // ── RECEIPT 073 — item partially illegible ──
  { receiptNo: "RCP-073", date: "2025-08-11", customer: "Keruji Damien",
    name: "Sub Zero Kit Mix [?] + Hardware [?]", brand: "[?]", category: "Other",
    priceSold: 600000, notes: `${ILLEGIBLE} - Items unclear. Balance: 250,000. Customer: Keruji Damien` },

  // ── RECEIPT 074 — brand illegible ──
  { receiptNo: "RCP-074", date: "2025-08-11", customer: "SK Records",
    name: "KKIC S Classic Speakers [?]", brand: "[?]", category: "Mixing & Mastering",
    priceSold: 2000000, notes: `${ILLEGIBLE} - Brand/model unclear. Customer: SK Records` },

  // ── RECEIPT 075 — items partially illegible ──
  { receiptNo: "RCP-075", date: "2025-08-11", customer: "CNEXT",
    name: "Pop Filter + Mic Stand + Akai MPK Mini [?]", brand: "Various", category: "Accessories",
    priceSold: 760000, notes: `${ILLEGIBLE} - Bundle items partially unclear. Customer: CNEXT` },

  // ── RECEIPT 076 — second item unclear ──
  { receiptNo: "RCP-076", date: "2025-08-14", customer: "Mulondo Hussein",
    name: "Behringer UM2 + Behringer CA [?]", brand: "Behringer", category: "Recording",
    priceSold: 900000, notes: `${ILLEGIBLE} - Second item unclear. Balance: 100,000. Customer: Mulondo Hussein` },

  // ── RECEIPT 077 — model unclear ──
  { receiptNo: "RCP-077", date: "2025-08-15", customer: "Buwembo",
    name: "Behringer RTA Mic [?]", brand: "Behringer", category: "Recording",
    priceSold: 400000, notes: `${ILLEGIBLE} - Exact model unclear. Customer: Buwembo` },

  // ── RECEIPT 078 ──
  { receiptNo: "RCP-078", date: "2025-08-15", customer: "K-Spice Media",
    name: "Zoom PodTrak PN", brand: "Zoom", category: "Podcast",
    priceSold: 1200000, notes: "Customer: K-Spice Media" },

  // ── RECEIPT 079 ──
  { receiptNo: "RCP-079", date: "2025-08-15", customer: "SK Records",
    name: "Focusrite Scarlett 2i2 Bundle Studio", brand: "Focusrite", category: "Recording",
    priceSold: 1650000, notes: "Customer: SK Records" },

  // ── RECEIPT 081 ──
  { receiptNo: "RCP-081", date: "2025-08-19", customer: "Rashid Kiberu",
    name: "Blackmagic ATEM Mini Pro Switcher", brand: "Blackmagic", category: "Livestreaming",
    priceSold: 2100000, notes: "Customer: Rashid Kiberu" },

  // ── RECEIPT 082 ──
  { receiptNo: "RCP-082", date: "2025-08-20", customer: "Francis Onyango",
    name: "Blackmagic ATEM Extreme Switcher", brand: "Blackmagic", category: "Livestreaming",
    priceSold: 3000000, notes: "Customer: Francis Onyango" },

  // ── RECEIPT 083 — item unclear ──
  { receiptNo: "RCP-083", date: "2025-08-21", customer: "Kizito Musitwa",
    name: "Triline SC3 Interface [?]", brand: "[?]", category: "Recording",
    priceSold: 340000, notes: `${ILLEGIBLE} - Brand/model unclear. Customer: Kizito Musitwa` },

  // ── RECEIPT 084 ──
  { receiptNo: "RCP-084", date: "2025-08-21", customer: "David Kiyingi",
    name: "Behringer XR18 Digital Mixer", brand: "Behringer", category: "Mixing & Mastering",
    priceSold: 2800000, notes: "Customer: David Kiyingi" },

  // ── RECEIPT 085 ──
  { receiptNo: "RCP-085", date: "2025-08-27", customer: "Kyeyune Frank",
    name: "Presonus Studio Pack (Used)", brand: "Presonus", category: "Recording",
    priceSold: 1000000, notes: "Used item. Customer: Kyeyune Frank" },

  // ── RECEIPT 086 ──
  { receiptNo: "RCP-086", date: "2025-08-21", customer: "Vincent",
    name: "Akai MPK Mini Controller MK3", brand: "Akai", category: "Recording",
    priceSold: 600000, notes: "Customer: Vincent" },

  // ── RECEIPT 087 — items partially unclear ──
  { receiptNo: "RCP-087", date: "2025-08-25", customer: "Eric Olanya",
    name: "2x Behringer Mics + Panda Mini + Behringer C2 [?]", brand: "Behringer", category: "Recording",
    priceSold: 1500000, notes: `${ILLEGIBLE} - Bundle details partially unclear. Customer: Eric Olanya` },

  // ── RECEIPT 088 ──
  { receiptNo: "RCP-088", date: "2025-08-25", customer: "Kayanja",
    name: "Presonus Studio 1824", brand: "Presonus", category: "Recording",
    priceSold: 1000000, notes: "Customer: Kayanja" },

  // ── RECEIPT 089 — items partially unclear ──
  { receiptNo: "RCP-089", date: "2025-08-25", customer: "Kavanda",
    name: "Mic Stand + Acoustic Foam + [?]", brand: "[?]", category: "Accessories",
    priceSold: 385000, notes: `${ILLEGIBLE} - One item unclear. Customer: Kavanda` },

  // ── RECEIPT 090 ──
  { receiptNo: "RCP-090", date: "2025-08-25", customer: "Maka Richard",
    name: "Focusrite Scarlett 2i2 Interface", brand: "Focusrite", category: "Recording",
    priceSold: 600000, notes: "Customer: Maka Richard" },

  // ── RECEIPT 091 ──
  { receiptNo: "RCP-091", date: "2025-08-25", customer: "Maka Richard",
    name: "M-Audio Keystation 49 MKII", brand: "M-Audio", category: "Recording",
    priceSold: 730000, notes: "Customer: Maka Richard" },

  // ── RECEIPT 093 — mostly illegible ──
  { receiptNo: "RCP-093", date: "2025-08-29", customer: "Rwothiio Samuel",
    name: "Toca/Tocana Platinum DUO Pro [?]", brand: "[?]", category: "Other",
    priceSold: 2209000, notes: `${ILLEGIBLE} - Item name very unclear. Customer: Rwothiio Samuel` },

  // ── RECEIPT 094 — item unclear ──
  { receiptNo: "RCP-094", date: "2025-08-29", customer: "Trinity Christian Church",
    name: "Behringer 404HD Audio Interface [?]", brand: "Behringer", category: "Recording",
    priceSold: 1200000, notes: `${ILLEGIBLE} - Exact model unclear. Customer: Trinity Christian Church` },

  // ── RECEIPT 095 — item unclear ──
  { receiptNo: "RCP-095", date: "2025-09-03", customer: "Ssempereza Moses",
    name: "SSI 2 Dust MKIII [?]", brand: "[?]", category: "Other",
    priceSold: 1700000, notes: `${ILLEGIBLE} - Brand/model very unclear. Customer: Ssempereza Moses` },

  // ── RECEIPT 096 ──
  { receiptNo: "RCP-096", date: "2025-09-04", customer: "Muliika Marvin",
    name: "Behringer Uphoria 204HD Interface", brand: "Behringer", category: "Recording",
    priceSold: 650000, notes: "Customer: Muliika Marvin" },

  // ── RECEIPT 097 — last item unclear ──
  { receiptNo: "RCP-097", date: "2025-09-08", customer: "St Joseph Catholic Church / St Paul Community Choir",
    name: "Behringer C2 Pair + Smiks Cables [?]", brand: "Behringer", category: "Recording",
    priceSold: 710000, notes: `${ILLEGIBLE} - Last item unclear. Customer: St Joseph Catholic Church` },

  // ── RECEIPT 098 — items unclear ──
  { receiptNo: "RCP-098", date: "2025-09-10", customer: "Buyinza Samuel (Tabernacle of Praise - Iganga)",
    name: "Delora Microphone + 8x Spanners + XLR Cables [?]", brand: "Various", category: "Recording",
    priceSold: 933000, notes: `${ILLEGIBLE} - Some items unclear. Customer: Buyinza Samuel - Tabernacle of Praise Iganga` },

  // ── RECEIPT 099 — customer name partially unclear ──
  { receiptNo: "RCP-099", date: "2025-09-11", customer: "Acellan Gn [?]",
    name: "Behringer B1 Condenser Microphone", brand: "Behringer", category: "Recording",
    priceSold: 700000, notes: "Customer name partially unclear on receipt. Customer: Acellan Gn [?]" },

  // ── RECEIPT 100 — very messy ──
  { receiptNo: "RCP-100", date: "2025-09-12", customer: "Dreck Alton",
    name: "Alesis V25 MK + Behringer C1 + UMC [?]", brand: "Various", category: "Recording",
    priceSold: 1330000, notes: `${ILLEGIBLE} - Amount very messy on receipt (~1,330,000). Bundle items unclear. Customer: Dreck Alton` },
];

async function main() {
  console.log(`Seeding ${receipts.length} receipt-based inventory items...`);
  let created = 0;
  let failed = 0;

  for (const r of receipts) {
    try {
      // Create inventory item
      const item = await prisma.inventoryItem.create({
        data: {
          name: r.name,
          brand: r.brand || "",
          category: r.category,
          qty: 1,
          dateBought: null,
          priceBought: 0,
          shippingCost: 0,
          priceSold: r.priceSold,
          status: "Sold",
          condition: "New",
          notes: r.notes || null,
        },
      });

      // Create sale record
      await prisma.inventoryItemSale.create({
        data: {
          inventoryItemId: item.id,
          qtySold: 1,
          priceSold: r.priceSold,
          dateSold: r.date,
          notes: `Receipt ${r.receiptNo}. Customer: ${r.customer}`,
        },
      });

      created++;
      if (created % 10 === 0) console.log(`  ${created}/${receipts.length} done...`);
    } catch (err) {
      console.error(`  FAILED receipt ${r.receiptNo}:`, err.message);
      failed++;
    }
  }

  console.log(`\n✅ Done! Created: ${created}, Failed: ${failed}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
