import { structuredDealDataset } from "./structuredDealDataset";

function parseMoneyToNumber(s?: string): number {
  if (!s) return 0;
  // "£4,300,000,000" -> 4300000000
  const cleaned = s.replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function buildMockDashboardRows() {
  const first = structuredDealDataset[0];

  return [
    {
      agreementId: 1,

      agreementName: first.dealName,
      borrower: first.borrower?.legalName ?? "—",
      agent: first.roles?.agent ?? "—",

      status: "PUBLISHED",

      lastUpdated: first.dates?.signingDate ?? "—",

      __mockFacilitiesCount: first.facility?.type ? 1 : 0,
      __mockTotalAmount: parseMoneyToNumber(first.facility?.totalSize),
    },
  ];
}

export function buildMockLenderInboxRows() {
  const nowIso = new Date().toISOString();
  return structuredDealDataset.map((x, idx) => ({
    id: idx + 1,
    dealName: x.dealName,
    recipientEmail: `${x.lender.replace(/\s+/g, ".")}@dealhub.com`,
    createdAt: nowIso,
    payload: JSON.stringify(x),
  }));
}
