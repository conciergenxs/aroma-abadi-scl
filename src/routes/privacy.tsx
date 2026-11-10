import { createFileRoute } from "@tanstack/react-router";
import { LegalDocument, type Clause } from "@/components/scl/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Aroma Abadi" },
      {
        name: "description",
        content:
          "What ARMA records about workspace members, Beauty Ambassadors and customers, why, how long it is kept and who it reaches.",
      },
    ],
  }),
  component: PrivacyPage,
});

const CLAUSES: Clause[] = [
  {
    heading: "What this policy covers",
    lead: "This covers the data held inside ARMA — about the people who use it and about the customers they talk to.",
    body: [
      "Aroma Abadi decides what is collected in ARMA and why. Three groups of people appear in it: workspace members who sign in, Beauty Ambassadors whose accounts are managed here, and the customers who message Aroma Abadi on WhatsApp.",
      "It does not cover WhatsApp itself. Messages travel through the WhatsApp Business Platform, which Meta runs under its own policies.",
    ],
  },
  {
    heading: "About workspace members",
    lead: "Your name, WhatsApp number, job title, role and sign-in activity.",
    body: [
      "An administrator enters your name, WhatsApp number and job title when they invite you, and assigns the role that decides what you can reach. ARMA records when you sign in and the changes you make to records, so an action can be traced to the person who took it.",
      "This is used to run the workspace and keep it accountable — nothing more. It is not used for advertising and is not sold.",
    ],
  },
  {
    heading: "About Beauty Ambassadors",
    lead: "Their profile, the Leader they report to, the brands they carry and their LMS credentials.",
    body: [
      "A Beauty Ambassador's record holds their name, WhatsApp number, gender, position, city, store, the brands assigned to them, the Leader they report to, and the password for their LMS account.",
      "The LMS password is stored so it can be shown to the people who manage that Ambassador and reset when needed. Only roles with the matching permission can reveal it, and revealing one is an action the workspace records.",
    ],
  },
  {
    heading: "About customers",
    lead: "The conversation, the contact record built around it, and the orders placed through it.",
    body: [
      "When a customer messages Aroma Abadi on WhatsApp, ARMA keeps the conversation and builds a contact record: name, WhatsApp number, the labels and audiences applied to them, their lifecycle stage, their point balance, and the orders recorded against them.",
      "Order data arrives from ARMA's own record of what was agreed in the conversation. It is kept as the sales record of the business.",
      "Customers are not profiled for advertising, and their records are not sold or shared with brand partners as data.",
    ],
  },
  {
    heading: "Why it is held",
    lead: "To answer customers, to run the Beauty Ambassador programme, and to keep an accurate record of trade.",
    body: [
      "Conversations and contact records exist so the next person to reply knows what was already said. Labels, audiences and lifecycle stages exist so a broadcast reaches people it is relevant to rather than everyone.",
      "Beauty Ambassador records exist to administer the programme — who reports to whom, which brands they carry, and whether their training account works.",
      "Order records exist because a business must be able to show what it sold.",
    ],
  },
  {
    heading: "Who can see what",
    lead: "Role decides reach, and every role is narrower than the whole.",
    body: [
      "A workspace member sees what their role opens and no more. Reading a customer's record, revealing a Beauty Ambassador's password or opening an order's detail are each their own permission, set in Settings → Roles & Permissions.",
      "Outside the workspace, data reaches only the services ARMA needs to run: the WhatsApp Business Platform to carry messages, and the hosting that runs the application. Each handles the data on Aroma Abadi's instructions.",
    ],
  },
  {
    heading: "How long it is kept",
    lead: "Records stay while they are needed, and deletions behave as the workspace describes.",
    body: [
      "A deleted contact moves to Recently Deleted and can be restored. Deleting that contact permanently removes the contact and the activity attached to them and cannot be undone; the orders placed by that customer stay in Transactions as part of the sales record.",
      "A workspace member's account is removed by an administrator when they leave. The records they created remain, because they are the workspace's record of what happened.",
    ],
  },
  {
    heading: "Asking about your data",
    lead: "Ask the administrator who manages your workspace, or message Aroma Abadi on WhatsApp.",
    body: [
      "If you are a workspace member or a Beauty Ambassador, your Super Admin can tell you what is held about you, correct it, or remove your account.",
      "If you are a customer, message Aroma Abadi on the same WhatsApp number you have been talking to and ask for your record. You can ask to see it, to have it corrected, or to have it deleted, and you can ask to stop receiving broadcasts at any time.",
      "Indonesian law on personal data protection applies to how Aroma Abadi handles these requests.",
    ],
  },
];

function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      summary="What ARMA records about the people who use it and the customers they talk to, why it is held, and who can reach it."
      effective="1 November 2026"
      clauses={CLAUSES}
      other={{ label: "Read the Terms of Service", to: "/terms" }}
    />
  );
}
