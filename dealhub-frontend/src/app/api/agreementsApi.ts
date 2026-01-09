// src/api/agreementsApi.ts
import { httpJson } from "./http";
import type {
  AgreementRowDto,
  AgreementVersion,
  CreateAgreementRequest,
  JsonValue,
} from "./contracts";

/* -----------------------------
   Lists / dashboard
----------------------------- */

export async function listRecent(days = 14): Promise<AgreementRowDto[]> {
  return httpJson("GET", `/agreements/recent?days=${days}`);
}

export async function listHistorical(q = ""): Promise<AgreementRowDto[]> {
  return httpJson("GET", `/agreements/historical?q=${encodeURIComponent(q)}`);
}

export async function createAgreement(req: CreateAgreementRequest) {
  return httpJson("POST", "/agreements", req);
}

export async function createDraft(
  agreementId: number,
  extractedJson: JsonValue
): Promise<AgreementVersion> {
  return httpJson("POST", `/agreements/${agreementId}/versions/draft`, extractedJson);
}

export async function validateVersionById(versionId: number): Promise<AgreementVersion> {
  return httpJson("POST", `/agreements/versions/${versionId}/validate`);
}

export async function publishVersion(versionId: number): Promise<AgreementVersion> {
  return httpJson("POST", `/agreements/versions/${versionId}/publish`);
}

/* -----------------------------
   Lender Inbox (Strategy A aligned)
   Backend returns payload as JsonNode => object/array/primitive => JsonValue
----------------------------- */

export type LenderInboxMessageDto = {
  id: number;
  dealName: string;
  lenderId: number;
  recipientEmail: string;
  createdAt: string;        // ISO
  payload: JsonValue | null; // ✅ aligned with contracts.ts JsonValue
};

export async function getLenderInbox(): Promise<LenderInboxMessageDto[]> {
  return httpJson("GET", "/agreements/lender/inbox");
}

/* -----------------------------
   Version read/update
----------------------------- */

export async function getVersionById(versionId: number | string): Promise<AgreementVersion> {
  return httpJson("GET", `/agreements/versions/${versionId}`);
}

export async function updateDraftById(
  versionId: number | string,
  extractedJson: JsonValue
): Promise<AgreementVersion> {
  return httpJson("PATCH", `/agreements/versions/${versionId}`, extractedJson);
}

/* -------------------------------------------------------
   Backward-compatible exports for existing UI imports
------------------------------------------------------- */

export const listRecentAgreements = listRecent;
export const listHistoricalAgreements = listHistorical;

/* -----------------------------
   Export helpers (UI)
----------------------------- */

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

export async function exportJson(versionId: number | string, data?: unknown): Promise<void> {
  const payload = data ?? {};
  downloadFile(
    `agreement_${versionId}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
}

export async function exportCsv(versionId: number | string, data?: any): Promise<void> {
  const obj = data && typeof data === "object" ? data : {};
  const keys = Object.keys(obj);

  const header = keys.join(",");
  const row = keys.map((k) => JSON.stringify(obj[k] ?? "")).join(",");
  const csv = keys.length ? `${header}\n${row}\n` : `key,value\n\n`;

  downloadFile(`agreement_${versionId}.csv`, csv, "text/csv;charset=utf-8");
}

/* -----------------------------
   Audit (stub)
----------------------------- */

export type AuditLogEntry = {
  ts: string;
  actorName: string;
  action: string;
  details?: string;
};

export async function getAudit(_agreementId: string | number): Promise<AuditLogEntry[]> {
  return [];
}

/* -----------------------------
   Legacy helpers (kept)
----------------------------- */

export async function getDraftVersion(_agreementId: string | number): Promise<AgreementVersion> {
  throw new Error(
    "getDraftVersion(agreementId) is not supported: backend has no GET /agreements/{agreementId}/versions/draft. " +
      "Use getVersionById(versionId) instead."
  );
}

export async function getValidatedVersion(_agreementId: string | number): Promise<AgreementVersion> {
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
