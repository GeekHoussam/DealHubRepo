import { httpJson } from "./http";
import type {
  AgreementRowDto,
  AgreementVersion,
  CreateAgreementRequest,
  JsonValue,
} from "./contracts";
import type { AgreementSummary } from "../types";

/**
 * Convert backend AgreementRowDto -> UI AgreementSummary
 * Uses your fields: agreementId, agreementName, lastUpdated, totalAmount, ...
 */
function parseTotalAmount(totalAmount: unknown): number {
  if (typeof totalAmount !== "string") return 0;

  const cleaned = totalAmount.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned) return 0;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;

  // if both, assume comma is thousand separator
  if (hasComma && hasDot) normalized = cleaned.replace(/,/g, "");
  // if comma only, also treat as thousand separator
  else if (hasComma && !hasDot) normalized = cleaned.replace(/,/g, "");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function toAgreementSummary(row: AgreementRowDto): AgreementSummary {
  const id = row.agreementId != null ? String(row.agreementId) : "";

  return {
    id,
    name: row.agreementName ?? (id ? `Agreement #${id}` : "Agreement"),
    borrower: row.borrower ?? "",
    agent: row.agent ?? "—",
    facilitiesCount:
      typeof row.facilitiesCount === "number" ? row.facilitiesCount : 0,
    totalAmount: parseTotalAmount((row as any).totalAmount),
    status: (row.status ?? "DRAFT") as AgreementSummary["status"],
    updatedAt: row.lastUpdated ? String(row.lastUpdated) : "",
    validatedAt: row.validatedAt ? String(row.validatedAt) : undefined,
    myCommitment: (row as any).myCommitment,
  };
}

/** -----------------------------
 * Raw rows (DTO) - KEEP AS IS
 * ----------------------------- */
export async function listRecent(days = 14): Promise<AgreementRowDto[]> {
  return httpJson("GET", `/agreements/recent?days=${days}`);
}

export async function listHistorical(q = ""): Promise<AgreementRowDto[]> {
  return httpJson("GET", `/agreements/historical?q=${encodeURIComponent(q)}`);
}

/** -----------------------------
 * ✅ Summary helpers (for tables using AgreementSummary)
 * ----------------------------- */
export async function listRecentAgreementSummaries(
  days = 14
): Promise<AgreementSummary[]> {
  const rows = await listRecent(days);
  return rows.map(toAgreementSummary);
}

export async function listHistoricalAgreementSummaries(
  q = ""
): Promise<AgreementSummary[]> {
  const rows = await listHistorical(q);
  return rows.map(toAgreementSummary);
}

export async function createAgreement(req: CreateAgreementRequest) {
  return httpJson("POST", "/agreements", req);
}

export async function createDraft(
  agreementId: number,
  extractedJson: JsonValue
): Promise<AgreementVersion> {
  return httpJson(
    "POST",
    `/agreements/${agreementId}/versions/draft`,
    extractedJson
  );
}

export async function validateVersionById(
  versionId: number
): Promise<AgreementVersion> {
  return httpJson("POST", `/agreements/versions/${versionId}/validate`);
}

export async function publishVersion(
  versionId: number
): Promise<AgreementVersion> {
  return httpJson("POST", `/agreements/versions/${versionId}/publish`);
}

export type LenderInboxMessageDto = {
  id: number;
  dealName?: string | null;
  lenderId?: number | null;
  recipientEmail?: string | null;
  createdAt?: string | null;
  payload?: JsonValue | null;
};

export async function getLenderInbox(): Promise<LenderInboxMessageDto[]> {
  return httpJson("GET", "/agreements/lender/inbox");
}

export async function getVersionById(
  versionId: number | string
): Promise<AgreementVersion> {
  return httpJson("GET", `/agreements/versions/${versionId}`);
}

export async function updateDraftById(
  versionId: number | string,
  extractedJson: JsonValue
): Promise<AgreementVersion> {
  return httpJson("PATCH", `/agreements/versions/${versionId}`, extractedJson);
}

export const listRecentAgreements = listRecent;
export const listHistoricalAgreements = listHistorical;

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportJson(
  versionId: number | string,
  data?: unknown
): Promise<void> {
  const payload = data ?? {};
  downloadFile(
    `agreement_${versionId}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
}

export async function exportCsv(
  versionId: number | string,
  data?: any
): Promise<void> {
  const obj = data && typeof data === "object" ? data : {};
  const keys = Object.keys(obj);

  const header = keys.join(",");
  const row = keys.map((k) => JSON.stringify(obj[k] ?? "")).join(",");
  const csv = keys.length ? `${header}\n${row}\n` : `key,value\n\n`;

  downloadFile(`agreement_${versionId}.csv`, csv, "text/csv;charset=utf-8");
}

export type AuditLogEntry = {
  ts: string;
  actorName: string;
  action: string;
  details?: string;
};

export async function getAudit(
  _agreementId: string | number
): Promise<AuditLogEntry[]> {
  return [];
}

export async function getDraftVersion(
  _agreementId: string | number
): Promise<AgreementVersion> {
  throw new Error(
    "getDraftVersion(agreementId) is not supported: backend has no GET /agreements/{agreementId}/versions/draft. " +
      "Use getVersionById(versionId) instead."
  );
}

export async function getValidatedVersion(
  _agreementId: string | number
): Promise<AgreementVersion> {
  throw new Error(
    "getValidatedVersion(agreementId) is not supported: backend has no GET /agreements/{agreementId}/versions/validated. " +
      "Use getVersionById(versionId) instead."
  );
}

export async function validateVersion(
  _agreementId: string | number,
  versionId: string | number
): Promise<AgreementVersion> {
  return httpJson("POST", `/agreements/versions/${versionId}/validate`);
}

export async function patchVersion(
  _agreementId: string | number,
  versionId: string | number,
  payload: unknown
): Promise<AgreementVersion> {
  return httpJson("PATCH", `/agreements/versions/${versionId}`, payload);
}
