export type Channel = "whatsapp" | "instagram";
export type LabelColor = "indigo" | "pink" | "emerald" | "amber" | "sky" | "violet" | "slate";

export const LIFECYCLE_STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Pending Payment",
  "Customer",
  "Lost",
  "No Reply",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

/** Grouped lifecycle stages used by the lifecycle dropdown. */
export const PROGRESSING_STAGES: LifecycleStage[] = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Pending Payment",
  "Customer",
];
export const LOST_STAGES: LifecycleStage[] = ["Lost", "No Reply"];

/**
 * Canonical lifecycle colors — Kanban is the source of truth.
 * Reused across the lifecycle dropdown, contact detail header,
 * contact cards and badges. Do not introduce new lifecycle colors.
 */
export const STAGE_COLORS: Record<
  LifecycleStage,
  { bar: string; dot: string; badge: string }
> = {
  "New Lead":        { bar: "bg-orange-500", dot: "bg-orange-500", badge: "border-orange-500/30 bg-orange-500/10 text-orange-300" },
  "Contacted":       { bar: "bg-blue-500",   dot: "bg-blue-500",   badge: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  "Qualified":       { bar: "bg-purple-500", dot: "bg-purple-500", badge: "border-purple-500/30 bg-purple-500/10 text-purple-300" },
  "Pending Payment": { bar: "bg-yellow-500", dot: "bg-yellow-500", badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300" },
  "Customer":        { bar: "bg-green-500",  dot: "bg-green-500",  badge: "border-green-500/30 bg-green-500/10 text-green-300" },
  "Lost":            { bar: "bg-red-500",    dot: "bg-red-500",    badge: "border-red-500/30 bg-red-500/10 text-red-300" },
  "No Reply":        { bar: "bg-gray-500",   dot: "bg-gray-500",   badge: "border-gray-500/30 bg-gray-500/10 text-gray-300" },
};

export type ContactLabel = {
  id: string;
  name: string;
  color: LabelColor;
};

export type ContactList = {
  id: string;
  name: string;
  description?: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  instagram?: string;
  channel: Channel;
  labelIds: string[];
  listIds: string[];
  lastInteraction: string;
  status: "Active" | "Inactive" | "Blocked";
  avatar: string;
  /** Future PIC / owner reference. "me" represents the current user. */
  ownerId?: string;
  /** Sales/CRM lifecycle stage — powers the Kanban view. */
  lifecycleStage?: string;
  /** ISO timestamp when contact entered the current lifecycleStage. */
  stageEnteredAt?: string;
  /** Values for user-defined custom properties, keyed by property key. */
  customFields?: Record<string, unknown>;
  /** Soft-delete flag — deleted contacts appear in Recently Deleted Contacts. */
  deleted?: boolean;
  /** ISO timestamp when contact was soft-deleted. */
  deletedAt?: string;
};

const avatars = ["JL", "MR", "SP", "AK", "DV", "RM", "NK", "PT", "EC", "BL", "TH", "OW"];

export const initialLabels: ContactLabel[] = [
  { id: "lb-influencer", name: "Influencer", color: "pink" },
  { id: "lb-vip", name: "VIP Customer", color: "amber" },
  { id: "lb-partner", name: "Partner", color: "indigo" },
  { id: "lb-creator", name: "Creator", color: "violet" },
  { id: "lb-team", name: "Internal Team", color: "slate" },
];

export const initialLists: ContactList[] = [
  { id: "ls-influencers-jkt", name: "Influencers Jakarta", description: "Jakarta-based creators" },
  { id: "ls-vip", name: "VIP Customers", description: "Top loyalty tier members" },
  { id: "ls-event", name: "Event Attendees", description: "Winter '26 launch night" },
  { id: "ls-launch", name: "Product Launch Audience", description: "Opted-in to launches" },
  { id: "ls-community", name: "Community Members", description: "Discord & WhatsApp group" },
];

export const contacts: Contact[] = [
  { id: "c1", name: "Jenna Loomis", phone: "+1 415 220 8841", instagram: "@jenna.l", channel: "whatsapp", labelIds: ["lb-vip", "lb-influencer"], listIds: ["ls-vip", "ls-launch"], lastInteraction: "2m ago", status: "Active", avatar: avatars[0], ownerId: "me" },
  { id: "c2", name: "Mateo Rivera", phone: "+34 612 998 014", instagram: "@mateo.rv", channel: "instagram", labelIds: ["lb-creator"], listIds: ["ls-launch"], lastInteraction: "11m ago", status: "Active", avatar: avatars[1], ownerId: "support-ai" },
  { id: "c3", name: "Saanvi Patel", phone: "+91 98220 11045", channel: "whatsapp", labelIds: ["lb-partner", "lb-vip"], listIds: ["ls-vip", "ls-event"], lastInteraction: "32m ago", status: "Active", avatar: avatars[2], ownerId: "me" },
  { id: "c4", name: "Aria Kapoor", phone: "+971 50 441 2208", instagram: "@aria.k", channel: "instagram", labelIds: ["lb-influencer"], listIds: ["ls-influencers-jkt"], lastInteraction: "1h ago", status: "Active", avatar: avatars[3] },
  { id: "c5", name: "Diego Velasco", phone: "+52 55 8830 2014", channel: "whatsapp", labelIds: [], listIds: ["ls-community"], lastInteraction: "2h ago", status: "Active", avatar: avatars[4], ownerId: "me" },
  { id: "c6", name: "Rin Mori", phone: "+81 90 4422 0011", instagram: "@rin.mori", channel: "instagram", labelIds: ["lb-creator", "lb-vip"], listIds: ["ls-vip", "ls-community"], lastInteraction: "3h ago", status: "Active", avatar: avatars[5], ownerId: "sales-ai" },
  { id: "c7", name: "Noor Khalid", phone: "+966 55 220 7711", channel: "whatsapp", labelIds: ["lb-partner"], listIds: ["ls-event"], lastInteraction: "5h ago", status: "Active", avatar: avatars[6], ownerId: "me" },
  { id: "c8", name: "Priya Tan", phone: "+65 8112 4490", instagram: "@priya.t", channel: "instagram", labelIds: ["lb-team"], listIds: [], lastInteraction: "Yesterday", status: "Inactive", avatar: avatars[7] },
  { id: "c9", name: "Elena Castillo", phone: "+34 691 220 887", channel: "whatsapp", labelIds: [], listIds: ["ls-launch", "ls-community"], lastInteraction: "Yesterday", status: "Active", avatar: avatars[8], ownerId: "me" },
  { id: "c10", name: "Ben Lowery", phone: "+44 7720 998 441", instagram: "@ben.lowery", channel: "instagram", labelIds: ["lb-creator"], listIds: ["ls-influencers-jkt"], lastInteraction: "2d ago", status: "Active", avatar: avatars[9] },
  { id: "c11", name: "Theo Halvorsen", phone: "+47 4422 8801", channel: "whatsapp", labelIds: ["lb-vip", "lb-partner"], listIds: ["ls-vip", "ls-event"], lastInteraction: "3d ago", status: "Active", avatar: avatars[10], ownerId: "me" },
  { id: "c12", name: "Olivia Wynn", phone: "+1 646 220 7780", instagram: "@oliviawynn", channel: "instagram", labelIds: ["lb-influencer"], listIds: ["ls-influencers-jkt", "ls-launch"], lastInteraction: "4d ago", status: "Active", avatar: avatars[11] },
];

export type Message = {
  id: string;
  from: "them" | "me";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
};

export const threadsByContact: Record<string, Message[]> = {
  c1: [
    { id: "m1", from: "them", text: "Hi! I saw the new winter collection drop today — is the Alpaca coat back in S?", time: "10:22" },
    { id: "m2", from: "me", text: "Hey Jenna! Yes, S restocked this morning. Want me to hold one for you?", time: "10:23", status: "read" },
    { id: "m3", from: "them", text: "Please do 🙏 also can I use my VIP code for early access?", time: "10:24" },
    { id: "m4", from: "me", text: "Already applied. Here's your private checkout link: acme.co/v/jenna-22", time: "10:25", status: "read" },
    { id: "m5", from: "them", text: "You're a lifesaver. Paying now.", time: "10:26" },
  ],
  c2: [
    { id: "m1", from: "them", text: "Saw your IG story about the studio launch — do you ship to Madrid?", time: "09:48" },
    { id: "m2", from: "me", text: "Hi Mateo! Yes, free EU shipping over €120. Want a recommendation for your space?", time: "09:50", status: "delivered" },
  ],
  c3: [
    { id: "m1", from: "them", text: "Can we get a quote for 120 enterprise gift boxes for our offsite?", time: "Yesterday" },
    { id: "m2", from: "me", text: "Absolutely — sending the enterprise catalog + bulk pricing now.", time: "Yesterday", status: "read" },
    { id: "m3", from: "them", text: "Perfect, looping in our procurement lead.", time: "Yesterday" },
  ],
};

export type Conversation = {
  id: string;
  contactId: string;
  channel: Channel;
  preview: string;
  time: string;
  unread: number;
  pinned?: boolean;
};

export const conversations: Conversation[] = [
  { id: "t1", contactId: "c1", channel: "whatsapp", preview: "You're a lifesaver. Paying now.", time: "10:26", unread: 2, pinned: true },
  { id: "t2", contactId: "c2", channel: "instagram", preview: "Saw your IG story about the studio launch — do you…", time: "09:48", unread: 1 },
  { id: "t3", contactId: "c3", channel: "whatsapp", preview: "Perfect, looping in our procurement lead.", time: "Yesterday", unread: 0 },
  { id: "t4", contactId: "c4", channel: "instagram", preview: "Loved the new drop! Any chance of a restock?", time: "Yesterday", unread: 0 },
  { id: "t5", contactId: "c5", channel: "whatsapp", preview: "Order #82201 arrived — gracias!", time: "2d", unread: 0 },
  { id: "t6", contactId: "c6", channel: "instagram", preview: "Can I get a discount for the bundle?", time: "2d", unread: 3 },
  { id: "t7", contactId: "c7", channel: "whatsapp", preview: "Sending the signed MSA tomorrow.", time: "3d", unread: 0 },
  { id: "t8", contactId: "c8", channel: "instagram", preview: "What sizes do you stock in Singapore?", time: "4d", unread: 0 },
];

export type Template = {
  id: string;
  name: string;
  category: "Marketing" | "Utility" | "Service" | "Reminder";
  channel: Channel;
  status: "Approved" | "Pending" | "Rejected" | "Draft";
  updated: string;
  body: string;
  groupId?: string;
  language?: string;
  rejectionReason?: string;
};

export type TemplateGroup = {
  id: string;
  name: string;
  color: "indigo" | "pink" | "emerald" | "amber" | "sky" | "violet" | "slate" | "rose";
};

export const initialTemplateGroups: TemplateGroup[] = [
  { id: "tg-promotions", name: "Promotions", color: "pink" },
  { id: "tg-loyalty", name: "Loyalty", color: "amber" },
  { id: "tg-cs", name: "Customer Service", color: "sky" },
  { id: "tg-events", name: "Events", color: "violet" },
  { id: "tg-membership", name: "Membership", color: "indigo" },
  { id: "tg-leadnurture", name: "Lead Nurturing", color: "emerald" },
  { id: "tg-transactional", name: "Transactional", color: "slate" },
];

export const TEMPLATE_LANGUAGES = [
  { code: "en_US", name: "English (US)" },
  { code: "en_GB", name: "English (UK)" },
  { code: "es_ES", name: "Spanish" },
  { code: "pt_BR", name: "Portuguese (Brazil)" },
  { code: "fr_FR", name: "French" },
  { code: "de_DE", name: "German" },
  { code: "id_ID", name: "Indonesian" },
  { code: "ja_JP", name: "Japanese" },
  { code: "zh_CN", name: "Chinese (Simplified)" },
] as const;

export const templates: Template[] = [
  { id: "tp1", name: "Winter Drop Launch", category: "Marketing", channel: "whatsapp", status: "Approved", updated: "2h ago", body: "Hi {{1}}, our Winter '26 drop just landed. VIPs get 24-hour early access — tap to shop.", groupId: "tg-promotions", language: "en_US" },
  { id: "tp2", name: "Order Shipped", category: "Utility", channel: "whatsapp", status: "Approved", updated: "1d ago", body: "Your order {{1}} is on its way. Track it live: {{2}}", groupId: "tg-transactional", language: "en_US" },
  { id: "tp3", name: "Abandoned Cart Nudge", category: "Marketing", channel: "instagram", status: "Approved", updated: "3d ago", body: "Hey {{1}}, your cart is waiting. We held your {{2}} for the next 24 hours.", groupId: "tg-promotions", language: "en_US" },
  { id: "tp4", name: "Appointment Reminder", category: "Reminder", channel: "whatsapp", status: "Approved", updated: "1w ago", body: "Reminder: your styling session is tomorrow at {{1}} with {{2}}.", groupId: "tg-events", language: "en_US" },
  { id: "tp5", name: "Support Follow-up", category: "Service", channel: "instagram", status: "Pending", updated: "5h ago", body: "Hi {{1}}, just checking in on ticket #{{2}}. Did we resolve it?", groupId: "tg-cs", language: "en_US" },
  { id: "tp6", name: "Loyalty Tier Upgrade", category: "Marketing", channel: "whatsapp", status: "Draft", updated: "30m ago", body: "Congrats {{1}}! You've unlocked Platinum. Here's what's new for you.", groupId: "tg-loyalty", language: "en_US" },
  { id: "tp7", name: "Restock Alert", category: "Utility", channel: "instagram", status: "Approved", updated: "2w ago", body: "{{1}} you wishlisted is back in stock. Tap to grab yours.", groupId: "tg-transactional", language: "en_US" },
  { id: "tp8", name: "Payment Failed", category: "Service", channel: "whatsapp", status: "Pending", updated: "6h ago", body: "Heads up {{1}} — payment for order {{2}} didn't go through. Retry here.", groupId: "tg-cs", language: "en_US" },
  { id: "tp9", name: "Flash Sale Blast", category: "Marketing", channel: "whatsapp", status: "Rejected", updated: "1d ago", body: "🔥 FLASH SALE {{1}}! 80% OFF EVERYTHING — TAP NOW before it ends!!!", groupId: "tg-promotions", language: "en_US", rejectionReason: "Content uses excessive promotional language and all-caps wording that violates WhatsApp Business policy. Tone down the messaging and resubmit." },
];

export type Broadcast = {
  id: string;
  name: string;
  channel: Channel;
  audience: string;
  reach: number;
  delivered: number;
  read: number;
  clicks: number;
  sentAt: string;
  status: "Sent" | "Scheduled" | "Draft";
  /** Channel connection id (matches `connectedChannels[i].id`). */
  channelId?: string;
  /** List ids selected for this broadcast (matches `initialLists[i].id`). */
  listIds?: string[];
  /** Total audience contact count. */
  totalAudience?: number;
  sendMode?: "now" | "schedule";
  scheduleDate?: string;
  scheduleTime?: string;
  createdBy?: string;
  createdAt?: string;
  contentMode?: "template" | "manual";
  templateId?: string;
  body?: string;
  footer?: string;
  buttons?: { label: string; kind: "quick_reply" | "url" | "phone" }[];
  /** Reply / failure counts surfaced by Analytics tab. */
  replied?: number;
  failed?: number;
};

export const broadcasts: Broadcast[] = [
  { id: "b1", name: "Winter Drop — VIP Early Access", channel: "whatsapp", audience: "VIP · 12,408", reach: 12408, delivered: 12380, read: 11244, clicks: 4128, sentAt: "Today · 09:00", status: "Sent",
    channelId: "wa-main", listIds: ["ls-vip", "ls-launch"], totalAudience: 12408, sendMode: "now", createdBy: "Priya Tan", createdAt: "Today · 08:42",
    contentMode: "template", templateId: "tp1", body: "Hi {{name}}, our Winter '26 drop just landed. VIPs get 24-hour early access — tap to shop.", footer: "Reply STOP to opt out.",
    buttons: [{ label: "Shop now", kind: "url" }], replied: 824, failed: 28 },
  { id: "b2", name: "Studio Launch — Madrid", channel: "instagram", audience: "EU Leads · 4,910", reach: 4910, delivered: 4880, read: 4112, clicks: 1342, sentAt: "Yesterday", status: "Sent",
    channelId: "ig-brand", listIds: ["ls-launch"], totalAudience: 4910, sendMode: "now", createdBy: "Mateo Rivera", createdAt: "Yesterday · 17:10",
    contentMode: "template", templateId: "tp3", body: "Hey {{name}}, our Madrid studio is open. Drop by this weekend for the launch party.", footer: "@scl.studio",
    buttons: [{ label: "RSVP", kind: "url" }], replied: 312, failed: 30 },
  { id: "b3", name: "Black Friday Teaser", channel: "whatsapp", audience: "All Contacts · 84,221", reach: 84221, delivered: 0, read: 0, clicks: 0, sentAt: "Fri · 08:00", status: "Scheduled",
    channelId: "wa-main", listIds: ["ls-community", "ls-launch"], totalAudience: 84221, sendMode: "schedule", scheduleDate: "2026-06-26", scheduleTime: "08:00",
    createdBy: "Priya Tan", createdAt: "2d ago",
    contentMode: "manual", body: "Hi {{name}} — Black Friday starts Friday at 8am. Early access for community members.", footer: "Reply STOP to opt out.",
    buttons: [{ label: "Preview drop", kind: "url" }], replied: 0, failed: 0 },
  { id: "b4", name: "Enterprise Holiday Gifting", channel: "whatsapp", audience: "Enterprise · 612", reach: 612, delivered: 610, read: 588, clicks: 244, sentAt: "3d ago", status: "Sent",
    channelId: "wa-eu", listIds: ["ls-vip"], totalAudience: 612, sendMode: "now", createdBy: "Noor Khalid", createdAt: "3d ago",
    contentMode: "template", templateId: "tp2", body: "Hi {{name}}, your enterprise gifting catalog is ready. Bulk pricing attached.",
    buttons: [{ label: "Download catalog", kind: "url" }], replied: 48, failed: 2 },
  { id: "b5", name: "Loyalty Tier Refresh", channel: "instagram", audience: "Active Customers · 22,114", reach: 22114, delivered: 0, read: 0, clicks: 0, sentAt: "—", status: "Draft",
    channelId: "ig-community", listIds: ["ls-community"], totalAudience: 22114, sendMode: "now", createdBy: "Rin Mori", createdAt: "30m ago",
    contentMode: "template", templateId: "tp6", body: "Congrats {{name}}! You've unlocked a new loyalty tier. Here's what's new for you.",
    buttons: [{ label: "View perks", kind: "url" }], replied: 0, failed: 0 },
];

// Charts
export const volumeSeries = [
  { d: "Mon", whatsapp: 4200, instagram: 1820 },
  { d: "Tue", whatsapp: 5120, instagram: 2014 },
  { d: "Wed", whatsapp: 4880, instagram: 2210 },
  { d: "Thu", whatsapp: 6020, instagram: 2510 },
  { d: "Fri", whatsapp: 7240, instagram: 3120 },
  { d: "Sat", whatsapp: 5410, instagram: 2840 },
  { d: "Sun", whatsapp: 4980, instagram: 2680 },
];

export const channelPerf = [
  { name: "WhatsApp", value: 68 },
  { name: "Instagram", value: 32 },
];

export const contactGrowth = [
  { m: "Jun", v: 12400 },
  { m: "Jul", v: 14820 },
  { m: "Aug", v: 16210 },
  { m: "Sep", v: 18540 },
  { m: "Oct", v: 21810 },
  { m: "Nov", v: 26120 },
  { m: "Dec", v: 29840 },
];

export const recentActivity = [
  { id: "a1", icon: "send", text: "Broadcast Winter Drop — VIP Early Access delivered to 12,380 contacts", time: "2m ago" },
  { id: "a2", icon: "user", text: "Saanvi Patel was tagged Enterprise by Priya Tan", time: "14m ago" },
  { id: "a3", icon: "msg", text: "Template Loyalty Tier Upgrade submitted for review", time: "32m ago" },
  { id: "a4", icon: "alert", text: "Instagram channel rate-limit warning resolved", time: "1h ago" },
  { id: "a5", icon: "user", text: "47 new contacts imported from Shopify sync", time: "2h ago" },
];

/**
 * Connected messaging channels for this workspace. Acts as the single
 * source of truth for any module that needs to pick a sending channel
 * (Broadcast, Templates, etc.).
 */
export type ConnectedChannel = {
  id: string;
  channel: Channel;
  name: string;
  handle: string;
  status: "connected" | "disconnected";
};

export const connectedChannels: ConnectedChannel[] = [
  { id: "wa-main", channel: "whatsapp", name: "SCL HQ", handle: "+1 415 555 0144", status: "connected" },
  { id: "wa-eu", channel: "whatsapp", name: "SCL Europe", handle: "+34 900 555 011", status: "connected" },
  { id: "ig-brand", channel: "instagram", name: "@scl.studio", handle: "Instagram Business", status: "connected" },
  { id: "ig-community", channel: "instagram", name: "@scl.community", handle: "Instagram Business", status: "connected" },
];