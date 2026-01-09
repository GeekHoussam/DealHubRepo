import type { AgreementRowDto } from "../api/contracts";
import { structuredDealDataset } from "./structuredDealDataset";

export function buildMockAgreementRowsForDashboard(): AgreementRowDto[] {
  const first = structuredDealDataset[0];

  return [
    {
      agreementId: 1,
      agreementName: first.dealName,
      borrower: first.borrower?.legalName ?? "—",
      agent: first.roles?.agent ?? "—",

      // simple demo values
      facilitiesCount: 1,
      totalAmount: first.facility?.totalSize ?? "—",
      status: "PUBLISHED",
      lastUpdated: first.dates?.signingDate ?? new Date().toISOString(),
      validatedAt: null,
    },
  ];
}
