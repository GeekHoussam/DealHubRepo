// src/app/mocks/mockLenderInbox.ts
import { structuredDealDataset } from "./structuredDealDataset";

export function buildMockLenderInboxRows() {
  const nowIso = new Date().toISOString();

  return structuredDealDataset.map((x, idx) => ({
    id: idx + 1,
    dealName: x.dealName,
    recipientEmail: `${x.lender.replace(/\s+/g, ".")}@dealhub.com`,
    createdAt: nowIso,
    payload: JSON.stringify(x), // EXACT lender json as string
  }));
}
