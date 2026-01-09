// src/utils/extractedJsonMetrics.ts

type AnyObj = Record<string, any>;

function toNumberAmount(v: unknown): number {
  if (v == null) return 0;
  const s = String(v);

  // keep digits, dot, comma, minus
  const cleaned = s.replace(/[^\d.,-]/g, "");

  // If it contains both comma and dot, assume comma thousands
  // If only comma, assume comma thousands as well.
  const normalized =
    cleaned.includes(".") && cleaned.includes(",")
      ? cleaned.replace(/,/g, "")
      : cleaned.includes(",") && !cleaned.includes(".")
        ? cleaned.replace(/,/g, "")
        : cleaned;

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function pickAmountValue(amountNode: any): number {
  // Supports:
  // amount: { value: "£4,300,000,000", ... }
  // amount: "£4,300,000,000"
  if (amountNode == null) return 0;
  if (typeof amountNode === "object" && "value" in amountNode) {
    return toNumberAmount(amountNode.value);
  }
  return toNumberAmount(amountNode);
}

export function getFacilitiesCount(extractedJson: AnyObj | null | undefined): number {
  const root = extractedJson ?? {};
  const facilities = root?.facilities;
  if (Array.isArray(facilities)) return facilities.length;
  return 0;
}

export function getTotalFacilityAmount(extractedJson: AnyObj | null | undefined): number {
  const root = extractedJson ?? {};
  const facilities = root?.facilities;
  if (!Array.isArray(facilities)) return 0;

  return facilities.reduce((sum: number, f: any) => {
    const amount = f?.amount ?? f?.commitmentAmount ?? f?.facilityAmount;
    return sum + pickAmountValue(amount);
  }, 0);
}

export function formatMoneyCompact(amount: number, currency = "$"): string {
  if (!Number.isFinite(amount)) return `${currency}0`;

  // compact formatting (1,200,000 -> 1.2M)
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  const fmt = (n: number, suffix: string) => `${sign}${currency}${n.toFixed(1).replace(/\.0$/, "")}${suffix}`;

  if (abs >= 1_000_000_000) return fmt(abs / 1_000_000_000, "B");
  if (abs >= 1_000_000) return fmt(abs / 1_000_000, "M");
  if (abs >= 1_000) return fmt(abs / 1_000, "K");

  return `${sign}${currency}${Math.round(abs).toString()}`;
}
