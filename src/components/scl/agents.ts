// ── Arma Personas ─────────────────────────────────────────────────────────
export type ArmaFacing = "customer" | "ba" | "operation";

export type ArmaPersona = {
  id: ArmaFacing;
  label: string;
  description: string;
  waNumber: string;
  waName: string;
  behavior: string;
  examples: string[];
  status: "active" | "inactive";
  color: string;
  bgColor: string;
};

export const ARMA_PERSONAS: ArmaPersona[] = [
  {
    id: "customer",
    label: "Customer Facing",
    description: "Interacts directly with end consumers — greeting, answering product questions, and recommending products based on their needs.",
    waNumber: "+62 811 9001 2233",
    waName: "Arma by Aroma Abadi",
    behavior: "Friendly, personal, product-driven. Focused on customer experience, product upsells, and post-purchase follow-up.",
    examples: [
      "Hai Kak! Berdasarkan kulit kakak yang dry, aku rekomendasiin Real Flawless Foundation dari Sisley — cocok banget!",
      "Promo 12.12 berlaku sampai tengah malam ya Kak! Kalau order sekarang free ongkir ke seluruh Indonesia.",
      "Gimana pengalaman kakak dengan produk yang kemarin? Ada yang bisa aku bantu?",
    ],
    status: "active",
    color: "text-sky-600",
    bgColor: "bg-sky-50 border-sky-100",
  },
  {
    id: "ba",
    label: "BA Facing",
    description: "Supports Beauty Advisors (BA) with product information, sales tips, and real-time knowledge updates.",
    waNumber: "+62 811 9002 3344",
    waName: "Arma for BA",
    behavior: "Informative, technical, professional. Focused on product knowledge, sales scripts, and BA performance reporting.",
    examples: [
      "SKU SIS-RFF-30 shade No.30 sudah restok di gudang Jakarta. ETA 2 hari kerja ke Pakuwon.",
      "Script untuk objeksi 'harganya mahal': fokus ke value — SPF 25, tahan 16 jam, natural glow finish.",
      "Performamu bulan ini: 48 transaksi, revenue Rp 117jt. Top 3 SKU: Foundation, Setting Spray, Concealer.",
    ],
    status: "active",
    color: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-100",
  },
  {
    id: "operation",
    label: "Operation Facing",
    description: "Helps the Aroma Abadi operations team with reminders, daily reports, stock alerts, and automatic performance monitoring.",
    waNumber: "+62 811 9003 4455",
    waName: "Arma Ops",
    behavior: "Concise, actionable, schedule-based. Sends reminders, alerts, and daily digests to Aroma Abadi staff on schedule.",
    examples: [
      "⏰ Reminder: 3 transaksi belum diproses lebih dari 24 jam. Cek dashboard sekarang.",
      "📦 Alert Stok: SKU SIS-RFF-30 tersisa 4 unit di Pakuwon. Perlu reorder?",
      "📊 Daily digest: Revenue hari ini Rp 24.5jt (+8% vs kemarin). 12 transaksi, 7 BA aktif.",
    ],
    status: "active",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100",
  },
];

// ── Generic AI Agents ──────────────────────────────────────────────────────
export type AIAgent = {
  id: string;
  name: string;
  description: string;
  status: "Connected" | "Disconnected";
  webhookUrl: string;
  authType: "None" | "API Key" | "Bearer Token";
};

export const AI_AGENTS: AIAgent[] = [
  {
    id: "arma",
    name: "Arma",
    description: "WhatsApp AI for Aroma Abadi — handles customer conversations automatically.",
    status: "Connected",
    webhookUrl: "https://agents.scl.app/webhooks/arma",
    authType: "Bearer Token",
  },
  {
    id: "support-ai",
    name: "Support AI",
    description: "Handles FAQ, shipping status, order tracking, and customer support conversations.",
    status: "Connected",
    webhookUrl: "https://agents.scl.app/webhooks/support",
    authType: "Bearer Token",
  },
  {
    id: "sales-ai",
    name: "Sales AI",
    description: "Handles lead qualification, promotions, product recommendations, and sales inquiries.",
    status: "Connected",
    webhookUrl: "https://agents.scl.app/webhooks/sales",
    authType: "API Key",
  },
];

export const isAgentId = (id?: string | null): boolean =>
  !!id && AI_AGENTS.some((a) => a.id === id);

export const findAgent = (id?: string | null): AIAgent | undefined =>
  id ? AI_AGENTS.find((a) => a.id === id) : undefined;
