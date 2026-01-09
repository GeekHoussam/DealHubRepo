// src/app/mocks/mockChat.ts
export type ChatMessage = {
  id: string;
  from: "LENDER" | "AGENT";
  text: string;
  ts: string; // ISO
};

export function buildMockChatThread(dealName: string, lenderEmail: string): ChatMessage[] {
  const now = new Date();
  const t = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60_000).toISOString();

  return [
    {
      id: "m1",
      from: "LENDER",
      ts: t(18),
      text: `Hi Agent, quick question on "${dealName}". Can you confirm the margin grid applies to all utilizations?`,
    },
    {
      id: "m2",
      from: "AGENT",
      ts: t(15),
      text:
        "Yes — for this demo deal, the margin grid is applied based on the utilization period bucket. " +
        "In production we can link it to the exact facility/pricing terms from the validated version.",
    },
    {
      id: "m3",
      from: "LENDER",
      ts: t(10),
      text: `Thanks! Also, is the Agent set as BNP Paribas for all lenders? (I’m ${lenderEmail})`,
    },
    {
      id: "m4",
      from: "AGENT",
      ts: t(6),
      text:
        "Correct — BNP Paribas is the Administrative Agent on this Facility Agreement. " +
        "All clarifications are tied to the same validated dataset to avoid mismatches across the syndicate.",
    },
  ];
}
