import { httpForm, httpBlob } from "./http";
import type { UploadDocumentResponse } from "./contracts";

export async function uploadDocument(
  file: File,
  agreementId?: number,
  documentType?: string
): Promise<UploadDocumentResponse> {
  const form = new FormData();
  form.append("file", file);

  const qs = new URLSearchParams();
  if (agreementId) qs.set("agreementId", String(agreementId));
  if (documentType) qs.set("documentType", documentType);

  const url = qs.toString()
    ? `/documents/upload?${qs}`
    : "/documents/upload";

  return httpForm<UploadDocumentResponse>(url, form);
}

export async function downloadDocument(documentId: number): Promise<Blob> {
  return httpBlob(`/documents/${documentId}/download`);
}
