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
    id: "support-ai",
    name: "Support AI",
    description:
      "Handles FAQ, shipping status, order tracking, and customer support conversations.",
    status: "Connected",
    webhookUrl: "https://agents.scl.app/webhooks/support",
    authType: "Bearer Token",
  },
  {
    id: "sales-ai",
    name: "Sales AI",
    description:
      "Handles lead qualification, promotions, product recommendations, and sales inquiries.",
    status: "Connected",
    webhookUrl: "https://agents.scl.app/webhooks/sales",
    authType: "API Key",
  },
];

export const isAgentId = (id?: string | null): boolean =>
  !!id && AI_AGENTS.some((a) => a.id === id);

export const findAgent = (id?: string | null): AIAgent | undefined =>
  id ? AI_AGENTS.find((a) => a.id === id) : undefined;