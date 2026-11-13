import { createFileRoute } from "@tanstack/react-router";
import { LegalDocument, type Clause } from "@/components/scl/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Aroma Abadi" },
      {
        name: "description",
        content:
          "The terms that govern use of the ARMA workspace: accounts, acceptable use, customer data and WhatsApp's own rules.",
      },
    ],
  }),
  component: TermsPage,
});

const CLAUSES: Clause[] = [
  {
    heading: "Who these terms bind",
    lead: "These terms apply to everyone who signs in to the ARMA workspace, and to Aroma Abadi as the company that runs it.",
    body: [
      "ARMA is the workspace Aroma Abadi uses to manage customer conversations on WhatsApp, the Beauty Ambassador roster, product knowledge, broadcasts, promo codes and the record of orders. Signing in means you accept these terms on behalf of yourself and of Aroma Abadi.",
      "If you are using ARMA as part of your work for a brand partner or an agency, you confirm that you are authorised to do so and that your employer accepts these terms too.",
    ],
  },
  {
    heading: "Accounts are issued, not opened",
    lead: "There is no public sign-up. An account exists because an administrator invited it.",
    body: [
      "An administrator creates your account from Settings and sends the invitation to your WhatsApp number. Your role decides what you can reach, and only a Super Admin can change it.",
      "Your account is yours alone. Do not share the number and password you sign in with, and tell an administrator straight away if you think someone else has used them. Anything done through your account is treated as done by you.",
      "When you leave the company or change role, an administrator removes or re-roles your account. Access ends at that moment.",
    ],
  },
  {
    heading: "Beauty Ambassador accounts",
    lead: "A Beauty Ambassador has an LMS login, not a workspace account — the two are separate systems.",
    body: [
      "Beauty Ambassadors sign in to the Aroma Abadi LMS with their WhatsApp number and a generated password. That account gives them training content and their own records. It does not give them access to ARMA, and a Beauty Ambassador never appears in User Management.",
      "Workspace members with the right permission can see a Beauty Ambassador's record, reveal their LMS password and reset it. Treat those credentials as you would your own: reveal one only when you need it, and never pass it on outside the people who manage that Ambassador.",
    ],
  },
  {
    heading: "How you may use ARMA",
    lead: "Use ARMA for Aroma Abadi's business, within WhatsApp's rules and Indonesian law.",
    body: [
      "Do not use the workspace to send messages a recipient has not agreed to receive, to contact people whose numbers you obtained outside Aroma Abadi's own channels, or to send content that is unlawful, misleading or harmful.",
      "Do not attempt to reach parts of the workspace your role does not open, to extract data in bulk by automated means, or to interfere with how the service runs for anyone else.",
      "Broadcasts go out through the WhatsApp Business Platform and are subject to Meta's policies as well as these terms. A template that Meta rejects or a number that Meta restricts is outside Aroma Abadi's control.",
    ],
  },
  {
    heading: "Customer data in the workspace",
    lead: "The customer records in ARMA belong to Aroma Abadi; your role is to look after them.",
    body: [
      "Contacts, conversations, labels, orders and the notes attached to them are Aroma Abadi's records. You may read and change them as your role allows, and only for the work you were given access to do.",
      "Deleting a contact moves them to Recently Deleted, where they can be restored. Deleting them permanently removes the contact and the activity attached to them, and cannot be undone. Past orders stay in Transactions so the sales record is unchanged.",
      "Exporting or copying customer records out of the workspace needs an administrator's approval. What leaves ARMA is no longer protected by it.",
    ],
  },
  {
    heading: "Availability and changes",
    lead: "ARMA is maintained continuously, which means it changes and occasionally pauses.",
    body: [
      "Features are added, renamed and removed as the product develops. Where a change affects how you work, it will be announced in the workspace before it lands.",
      "The service can be interrupted by maintenance, by the WhatsApp Business Platform, or by faults. Aroma Abadi works to keep interruptions short but does not promise uninterrupted availability.",
    ],
  },
  {
    heading: "Ending access",
    lead: "Aroma Abadi can suspend or remove an account that is misused.",
    body: [
      "An account may be suspended immediately where there is reason to believe it has been used to breach these terms, to put customer data at risk, or to break WhatsApp's rules. Where it is practical to do so, you will be told why.",
      "Ending access does not remove the records you created in the workspace. Those remain Aroma Abadi's.",
    ],
  },
  {
    heading: "Questions about these terms",
    lead: "Ask the administrator who manages your workspace.",
    body: [
      "Any question about these terms — what a clause covers, how a decision was reached, or a change you think is needed — goes to the Super Admin of your workspace, who will raise it with Aroma Abadi.",
      "Indonesian law governs these terms.",
    ],
  },
];

function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      summary="What you agree to when you sign in to ARMA, the workspace Aroma Abadi uses to run customer conversations on WhatsApp."
      effective="1 November 2026"
      clauses={CLAUSES}
      other={{ label: "Read the Privacy Policy", to: "/privacy" }}
    />
  );
}
