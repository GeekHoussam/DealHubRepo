export const structuredDealDataset = [
  {
    dealName: "Facility Agreement",
    lender: "BNP Paribas",
    borrower: { legalName: "CARLSBERG BREWERIES A/S", otherLegalDetails: null },
    roles: {
      agent: "BNP Paribas",
      arrangers: null,
      lenderRole: "Original Lender",
    },
    participation: {
      commitmentAmount: "£1,433,333,333.34",
      commitmentCurrency: "GBP",
      sharePercentage: "33.33% (Calculated)",
    },
    facility: {
      totalSize: "£4,300,000,000",
      currency: "GBP",
      type: "Multicurrency Term Loan Facility",
    },
    purpose: null,
    dates: {
      signingDate: "8 July 2024",
      closingDate: null,
      terminationDateInitial: "1 August 2026",
      terminationDateExtended: null,
    },
    availabilityAndUtilization: null,
    pricing: {
      marginGrid: [
        { period: "0–3 months", margin: "0.50% p.a." },
        { period: ">3–6 months", margin: "0.60% p.a." },
        { period: ">6–9 months", margin: "0.70% p.a." },
        { period: ">9–12 months", margin: "0.80% p.a." },
      ],
      ratingAdjustmentRules: null,
    },
    fees: { upfrontFee: null, agencyFee: null, tickingFee: null },
    dayCountConvention: null,
  },
] as const;
