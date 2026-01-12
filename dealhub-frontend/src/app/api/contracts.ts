/* -----------------------------
   Shared JSON type 
----------------------------- */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

/* -----------------------------
   Auth
----------------------------- */
export type UserRole = "ADMIN" | "AGENT" | "LENDER" | string;

export type LoginRequest = {
  email: string;
  password: string;
};

export interface LoginResponse {
  accessToken?: string;
  token?: string;
}

export interface MeResponse {
  id: number | string;
  role: UserRole;
  email?: string;
}

/* -----------------------------
   Admin / Users (IAM)
----------------------------- */
export type CreateUserRole = "ADMIN" | "AGENT" | "LENDER";

export interface CreateUserRequest {
  email: string;
  password: string;
  role: CreateUserRole;
  lenderId?: number | null; // required only when role === "LENDER"
}

export interface UserDto {
  id: number;
  email: string;
  role: CreateUserRole | string;
  lenderId?: number | null;
  enabled?: boolean;
}

/* -----------------------------
   Documents
----------------------------- */
export interface UploadDocumentResponse {
  documentId: number;
  agreementId?: number;
  message?: string;
  originalFileName?: string;
}

/* -----------------------------
   Extraction
----------------------------- */
export interface StartExtractionRequest {
  agreementId: number;
  documentId: number;
  documentType?: string;

  extractionProfile?: string;
}

export type ExtractionStatus =
  | "QUEUED"
  | "RUNNING"
  | "DONE"
  | "FAILED"
  | string;

export interface ExtractionResponse {
  id?: string;
  key?: string;
  jobKey?: string;

  status: ExtractionStatus;

  agreementId?: number;
  documentId?: number;

  extracted?: JsonValue;
  result?: JsonValue;
  output?: JsonValue;
  resultJson?: JsonValue;

  error?: string;
  errorMessage?: string;
}

/* -----------------------------
   Agreements (Dashboard + Versions)
----------------------------- */
export type AgreementStatus = "DRAFT" | "VALIDATED" | "PUBLISHED" | string;

export interface AgreementRowDto {
  agreementId: number;
  agreementName: string;
  borrower: string;
  agent: string;
  facilitiesCount: number;
  totalAmount: string;
  status: string; // or "DRAFT" | "VALIDATED" | "PUBLISHED"
  lastUpdated: string;
  validatedAt?: string | null;
}

export interface AgreementVersion {
  id: number;
  agreementId?: number;
  status?: AgreementStatus;

  payload?: JsonValue; // draft JSON
  goldenSource?: JsonValue; // published JSON

  createdAt?: string;
  updatedAt?: string;
}

/* -----------------------------
   Create Agreement
----------------------------- */
export interface CreateAgreementRequest {
  name: string;
  borrower: string;
  agent: string;
}
