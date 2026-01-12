import { useEffect, useMemo, useState } from "react";
import { UploadCard } from "../UploadCard";
import { ResultsCard } from "../ResultsCard";
import { pollExtraction, startExtraction } from "../../api/extractionsApi";
import { toast } from "sonner";
import { listMyBorrowers, type BorrowerDto } from "../../api/borrowersApi";
import {
  createAgreement,
  createDraft,
  validateVersionById,
  publishVersion,
  patchVersion,
} from "../../api/agreementsApi";
import { uploadDocument } from "../../api/documentsApi";
import { useAuth } from "../../context/AuthContext";

type ValidationIssue = { field: string; message: string };

function buildValidationIssues(resultJson: any): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const gaps = resultJson?.validationAndGaps;
  if (!gaps) return issues;

  const pushAll = (field: string, arr: any) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) issues.push({ field, message: String(item) });
  };

  pushAll("missing", gaps.missingItems);
  pushAll("nonSearchable", gaps.nonSearchablePages);
  pushAll("notes", gaps.notes);
  return issues;
}

function isValueObj(x: any) {
  return x && typeof x === "object" && "value" in x && "citation" in x;
}

function friendlyValue(x: any): string {
  if (x == null) return "—";
  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean")
    return String(x);
  if (isValueObj(x)) return x.value == null ? "—" : String(x.value);
  if (Array.isArray(x)) return `[${x.length} items]`;
  return "[object]";
}

function jsonToFriendlyText(obj: any): string {
  const lines: string[] = [];

  const walk = (node: any, path: string) => {
    if (node == null) return;

    if (isValueObj(node)) {
      const v = node.value == null ? "—" : String(node.value);
      const cite = node.citation
        ? `  (citation: ${String(node.citation)})`
        : "";
      const ev = node.evidence ? `  (evidence: ${String(node.evidence)})` : "";
      lines.push(`${path}: ${v}${cite}${ev}`);
      return;
    }

    if (typeof node !== "object") {
      lines.push(`${path}: ${String(node)}`);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((it, idx) => walk(it, `${path}[${idx}]`));
      return;
    }

    for (const [k, v] of Object.entries(node)) {
      const next = path ? `${path}.${k}` : k;
      if (v == null) continue;
      walk(v, next);
    }
  };

  walk(obj, "");
  if (!lines.length) return "No raw text available";
  return lines.join("\n");
}

export function ExtractPage() {
  const { user } = useAuth();

  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // UI status
  const [status, setStatus] = useState<"ready" | "extracting" | "extracted">(
    "ready"
  );

  // Borrowers
  const [borrowers, setBorrowers] = useState<BorrowerDto[]>([]);
  const [borrowersLoading, setBorrowersLoading] = useState(false);
  const [borrowerId, setBorrowerId] = useState<number | "">("");

  const selectedBorrowerName = useMemo(() => {
    if (!borrowerId) return "";
    return borrowers.find((b) => b.id === borrowerId)?.name ?? "";
  }, [borrowerId, borrowers]);

  const [agreementId, setAgreementId] = useState<number | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [versionId, setVersionId] = useState<number | null>(null);

  // Results
  const [dealSummary, setDealSummary] = useState<{
    dealName: string;
    borrower: string;
    agent: string;
  } | null>(null);

  const [extractedData, setExtractedData] = useState<Record<
    string,
    any
  > | null>(null);
  const [editableJsonText, setEditableJsonText] = useState<string>("");

  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>(
    []
  );
  const [rawText, setRawText] = useState("");
  const [jobKey, setJobKey] = useState<string | null>(null);

  const [validateBusy, setValidateBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);

  // Load borrowers once
  useEffect(() => {
    (async () => {
      setBorrowersLoading(true);
      try {
        const data = await listMyBorrowers();
        setBorrowers(data);
        if (data.length > 0) setBorrowerId(data[0].id);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load borrowers");
      } finally {
        setBorrowersLoading(false);
      }
    })();
  }, []);

  const resetResults = () => {
    setDealSummary(null);
    setExtractedData(null);
    setEditableJsonText("");
    setValidationIssues([]);
    setRawText("");
    setJobKey(null);
    setAgreementId(null);
    setDocumentId(null);
    setVersionId(null);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
    setStatus("ready");
    resetResults();

    if (selectedBorrowerName) {
      setDealSummary({
        dealName: "Facility Agreement",
        borrower: selectedBorrowerName,
        agent: "—",
      });
    }
  };

  const parseEditableJson = (): any => {
    const t = (editableJsonText || "").trim();
    if (!t) return {};
    try {
      return JSON.parse(t);
    } catch {
      throw new Error(
        "Invalid JSON in editor. Please fix it before validating/publishing."
      );
    }
  };

  const handleExtract = async () => {
    if (!borrowerId) return toast.error("Please select a borrower");
    if (!selectedFile) return toast.error("Please upload a PDF first");

    const borrowerName = selectedBorrowerName;
    if (!borrowerName) return toast.error("Invalid borrower selection");

    const agentName =
      (user as any)?.email ??
      (user as any)?.name ??
      (user as any)?.username ??
      "DealHub Agent";

    setStatus("extracting");
    resetResults();

    try {
      const agreement = await createAgreement({
        name: "Demo Agreement",
        borrower: borrowerName,
        agent: agentName,
      } as any);

      const newAgreementId = Number((agreement as any)?.id);
      if (!newAgreementId)
        throw new Error("Agreement creation failed: missing agreement id");
      setAgreementId(newAgreementId);

      const uploaded = await uploadDocument(
        selectedFile,
        newAgreementId,
        "FACILITY_AGREEMENT"
      );
      const newDocumentId = Number((uploaded as any)?.id);
      if (!newDocumentId)
        throw new Error("Document upload failed: missing document id");
      setDocumentId(newDocumentId);

      const started = await startExtraction({
        documentId: newDocumentId,
        agreementId: newAgreementId,
        extractionProfile: "FACILITY_AGREEMENT",
      });

      setJobKey(started.jobKey);
      toast.message("Extraction started", {
        description: `Job: ${started.jobKey}`,
      });

      const finalJob = await pollExtraction(started.jobKey, {
        intervalMs: 1500,
        timeoutMs: 180000,
      });

      if (String(finalJob.status ?? "").toUpperCase() === "FAILED") {
        throw new Error(
          finalJob.errorMessage || finalJob.error || "Extraction failed"
        );
      }

      const result =
        (finalJob.resultJson as any) ??
        (finalJob.output as any) ??
        (finalJob.result as any) ??
        (finalJob.extracted as any) ??
        {};

      const draft = await createDraft(newAgreementId, result as any);
      const newVersionId = Number((draft as any)?.id);
      if (!newVersionId)
        throw new Error("Draft creation failed: missing version id");
      setVersionId(newVersionId);

      const draftJson =
        (draft as any)?.extractedJson ??
        (draft as any)?.resultJson ??
        result ??
        {};

      setExtractedData(draftJson);
      setEditableJsonText(JSON.stringify(draftJson, null, 2));

      setValidationIssues(buildValidationIssues(draftJson));

      setRawText(jsonToFriendlyText(draftJson));

      const borrower =
        friendlyValue(draftJson?.parties?.borrower?.legalName) ||
        friendlyValue(draftJson?.parties?.borrowerName) ||
        borrowerName;

      const adminAgent =
        friendlyValue(draftJson?.parties?.administrativeAgent?.legalName) ||
        friendlyValue(draftJson?.parties?.administrativeAgentName) ||
        agentName;

      const dealName =
        friendlyValue(draftJson?.dealName) ||
        friendlyValue(draftJson?.profile) ||
        (agreement as any)?.name ||
        "Facility Agreement";

      setDealSummary({
        dealName: String(dealName),
        borrower: String(borrower || "—"),
        agent: String(adminAgent || "—"),
      });

      setStatus("extracted");
      toast.success("Extraction completed (Draft created)");
    } catch (e: any) {
      console.error(e);
      toast.error("Extraction error", { description: e?.message || String(e) });
      setStatus("ready");
    }
  };

  const handleSaveEdits = async () => {
    if (!agreementId || !versionId) {
      toast.error("Missing agreement/version. Re-run extraction.");
      return;
    }

    try {
      const edited = parseEditableJson();

      try {
        const updated = await patchVersion(agreementId, versionId, edited);
        const updatedJson = (updated as any)?.extractedJson ?? edited;

        setExtractedData(updatedJson);
        setEditableJsonText(JSON.stringify(updatedJson, null, 2));
        setValidationIssues(buildValidationIssues(updatedJson));
        setRawText(jsonToFriendlyText(updatedJson));
        toast.success("Draft updated");
        return;
      } catch (patchErr) {
        const newDraft = await createDraft(agreementId, edited);
        const newVid = Number((newDraft as any)?.id);
        if (!newVid) throw patchErr;

        setVersionId(newVid);

        const newJson = (newDraft as any)?.extractedJson ?? edited;
        setExtractedData(newJson);
        setEditableJsonText(JSON.stringify(newJson, null, 2));
        setValidationIssues(buildValidationIssues(newJson));
        setRawText(jsonToFriendlyText(newJson));
        toast.success("Draft updated (new version created)");
      }
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message || String(e) });
    }
  };

  const handleValidate = async () => {
    if (!agreementId || !versionId) {
      toast.error("Missing agreement/version. Re-run extraction.");
      return;
    }

    setValidateBusy(true);
    try {
      const validated = await validateVersionById(versionId);

      const validatedJson =
        (validated as any)?.extractedJson ??
        (validated as any)?.resultJson ??
        extractedData ??
        {};

      setExtractedData(validatedJson);
      setEditableJsonText(JSON.stringify(validatedJson, null, 2));
      setValidationIssues(buildValidationIssues(validatedJson));
      setRawText(jsonToFriendlyText(validatedJson));

      toast.success("Validated");
    } catch (e: any) {
      console.error(e);
      toast.error("Validation failed", {
        description: e?.message || String(e),
      });
    } finally {
      setValidateBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!versionId) {
      toast.error("Missing version. Validate first.");
      return;
    }

    setPublishBusy(true);
    try {
      const published = await publishVersion(versionId);

      const publishedJson =
        (published as any)?.extractedJson ??
        (published as any)?.resultJson ??
        extractedData ??
        {};

      setExtractedData(publishedJson);
      setEditableJsonText(JSON.stringify(publishedJson, null, 2));
      setValidationIssues(buildValidationIssues(publishedJson));
      setRawText(jsonToFriendlyText(publishedJson));

      toast.success("Published");
    } catch (e: any) {
      console.error(e);
      toast.error("Publish failed", { description: e?.message || String(e) });
    } finally {
      setPublishBusy(false);
    }
  };

  return (
    <main className="p-6 flex gap-6 max-w-[1440px] mx-auto">
      <UploadCard
        fileName={fileName}
        status={status}
        dealSummary={dealSummary}
        borrowers={borrowers}
        borrowersLoading={borrowersLoading}
        borrowerId={borrowerId}
        onBorrowerChange={setBorrowerId}
        onFileSelect={handleFileSelect}
        onExtract={handleExtract}
      />

      <ResultsCard
        extractedData={extractedData}
        validationIssues={validationIssues}
        rawText={rawText}
        agreementId={agreementId}
        documentId={documentId}
        versionId={versionId}
        editableJsonText={editableJsonText}
        onEditableJsonTextChange={setEditableJsonText}
        onSaveEdits={handleSaveEdits}
        onValidate={handleValidate}
        onPublish={handlePublish}
        validateBusy={validateBusy}
        publishBusy={publishBusy}
      />
    </main>
  );
}
