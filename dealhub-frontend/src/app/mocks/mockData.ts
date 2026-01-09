// src/app/mocks/mockData.ts
import { structuredDealDataset } from "./structuredDealDataset";

function parseMoneyToNumber(s?: string): number {
  if (!s) return 0;
  // "£4,300,000,000" -> 4300000000
  const cleaned = s.replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// ---- Dashboard: ONE deal row (mapped from your JSON) ----
export function buildMockDashboardRows() {
  const first = structuredDealDataset[0];

  return [
    {
      // keep agreementId so buttons that need it can be enabled/disabled safely
      agreementId: 1,

      agreementName: first.dealName,
      borrower: first.borrower?.legalName ?? "—",
      agent: first.roles?.agent ?? "—",

      // pick a stable status for demo
      status: "PUBLISHED",

      // used by your UI in formatUpdated()
      lastUpdated: first.dates?.signingDate ?? "—",

      // IMPORTANT: provide UI-only fallback values (we’ll use them in DashboardPage)
      __mockFacilitiesCount: first.facility?.type ? 1 : 0,
      __mockTotalAmount: parseMoneyToNumber(first.facility?.totalSize),
    },
  ];
}

// ---- Lender Inbox: 3 messages, each payload = the EXACT lender JSON ----
export function buildMockLenderInboxRows() {
  const nowIso = new Date().toISOString();
  return structuredDealDataset.map((x, idx) => ({
    id: idx + 1,
    dealName: x.dealName,
    recipientEmail: `${x.lender.replace(/\s+/g, ".")}@dealhub.com`,
    createdAt: nowIso,
    payload: JSON.stringify(x), // <-- exactly your JSON per lender
  }));
}
