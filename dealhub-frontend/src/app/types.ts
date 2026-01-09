export type UserRole = "ADMIN" | "AGENT" | "LENDER";

export interface UserProfile {
  id: string;
  fullName?: string;
  email?: string;
  role: UserRole;
  lenderId?: string | null;
}

export type AgreementStatus = "DRAFT" | "VALIDATED" | "PUBLISHED";

export interface AgreementSummary {
  id: string;
  name: string;
  borrower: string;
  agent: string;
  facilitiesCount: number;
  totalAmount: number;
  status: AgreementStatus;
  updatedAt: string;
  validatedAt?: string;
  myCommitment?: number;
}

/** ✅ New: extraction field shape you showed in JSON */
export type ExtractionField<T> = {
  value: T;
  citation?: string | null;
  evidence?: string | null;
};

export type ExtractionLender = {
  name?: ExtractionField<string>;
  shareAmount?: ExtractionField<string>;
  sharePercentage?: ExtractionField<string>;
};

export type ExtractionFacility = {
  facilityType?: ExtractionField<string>;
  currency?: ExtractionField<string>;
  amount?: ExtractionField<string>;
};

export type ExtractionResultJson = {
  profile?: string;
  documentId?: number;
  agreementId?: number;
  parties?: {
    borrowerName?: ExtractionField<string>;
    administrativeAgentName?: ExtractionField<string>;
    lenders?: ExtractionLender[];
  };
  keyDates?: {
    agreementDate?: ExtractionField<string>;
    effectiveDate?: ExtractionField<string>;
    expiryDate?: ExtractionField<string>;
    maturityDate?: ExtractionField<string>;
  };
  facilities?: ExtractionFacility[];
  pricing?: {
    baseRate?: ExtractionField<string>;
    margin?: ExtractionField<string>;
  };
  interestPeriods?: any[];
};

export type ExtractionJob = {
  jobKey?: string;
  documentId?: number;
  agreementId?: number;
  extractionProfile?: string;
  status?: string;
  resultJson?: ExtractionResultJson;
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export interface AgreementVersion {
  id: number;
  agreementId: number;
  status: AgreementStatus;
  extractedJson: ExtractionJob; // ✅ not flat fields anymore
  createdAt?: string;
  validatedAt?: string | null;
  validatedBy?: string | null;
  rawText?: string | null;
  confidence?: number | null;
}

export interface AuditLogEntry {
  ts: string;
  actorName: string;
  action: string;
  details?: string;
}

export interface EditableFields {
  // keep your editor payload shape (whatever your PATCH expects)
  [key: string]: any;
}
