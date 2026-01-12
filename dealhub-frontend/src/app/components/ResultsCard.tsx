import { useMemo, useState } from "react";
import { Button } from "./Button";

type ValidationIssue = { field: string; message: string };

type Props = {
  extractedData: Record<string, any> | null;
  validationIssues: ValidationIssue[];
  rawText: string;

  agreementId: number | null;
  documentId: number | null;
  versionId: number | null;

  editableJsonText: string;
  onEditableJsonTextChange: (v: string) => void;

  onSaveEdits: () => Promise<void> | void;
  onValidate: () => Promise<void> | void;
  onPublish: () => Promise<void> | void;

  validateBusy?: boolean;
  publishBusy?: boolean;
};

export function ResultsCard({
  extractedData,
  rawText,
  agreementId,
  documentId,
  versionId,
  editableJsonText,
  onEditableJsonTextChange,
  onSaveEdits,
  onValidate,
  onPublish,
  validateBusy,
  publishBusy,
}: Props) {
  const [rawOpen, setRawOpen] = useState(false);

  const hasData = !!extractedData;
  const canValidate = !!versionId;
  const canPublish = !!versionId;

  const prettyJson = useMemo(() => {
    if (!extractedData) return "";
    try {
      return JSON.stringify(extractedData, null, 2);
    } catch {
      return String(extractedData);
    }
  }, [extractedData]);

  return (
    <section className="flex-1 bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base text-[#0B1F3B]">Extracted Output</h2>

          {(agreementId || documentId || versionId) && (
            <p className="text-[12px] text-gray-500 mt-1">
              Agreement: {agreementId ?? "—"} · Document: {documentId ?? "—"} ·
              Version: {versionId ?? "—"}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              const blob = new Blob([editableJsonText || "{}"], {
                type: "application/json;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `draft_version_${versionId ?? "unknown"}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
            disabled={!editableJsonText}
          >
            Download JSON
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              const obj =
                extractedData && typeof extractedData === "object"
                  ? extractedData
                  : {};
              const keys = Object.keys(obj);
              const header = keys.join(",");
              const row = keys
                .map((k) => JSON.stringify((obj as any)[k] ?? ""))
                .join(",");
              const csv = keys.length ? `${header}\n${row}\n` : `key,value\n\n`;

              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `draft_version_${versionId ?? "unknown"}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
            disabled={!hasData}
          >
            Download CSV
          </Button>
        </div>
      </div>

      <div className="mt-4 border-b border-gray-200 flex gap-6">
        <div className="pb-2 text-sm text-[#0B1F3B] border-b-2 border-[#0B1F3B]">
          Extracted JSON
        </div>
      </div>

      {/* JSON CONTENT */}
      <div className="mt-4">
        {!hasData ? (
          <div className="h-[380px] bg-gray-50 rounded-lg flex items-center justify-center text-sm text-gray-400">
            No extraction results yet. Upload and extract a PDF to see data
            here.
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Edit draft JSON before validation/publish (optional).
              </p>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={onSaveEdits}
                  disabled={!canValidate}
                >
                  Save Draft
                </Button>
                <Button
                  variant="secondary"
                  onClick={onValidate}
                  disabled={!canValidate || !!validateBusy}
                >
                  {validateBusy ? "Validating..." : "Validate"}
                </Button>
                <Button
                  variant="primary"
                  onClick={onPublish}
                  disabled={!canPublish || !!publishBusy}
                >
                  {publishBusy ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </div>

            <textarea
              value={editableJsonText}
              onChange={(e) => onEditableJsonTextChange(e.target.value)}
              className="w-full h-[420px] rounded-lg border border-gray-200 bg-white p-3 font-mono text-[12px] leading-5 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/30"
            />

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-gray-600">
                Show read-only JSON
              </summary>
              <pre className="mt-2 bg-gray-50 rounded-lg p-3 overflow-auto text-[12px] leading-5">
                {prettyJson}
              </pre>
            </details>
          </>
        )}
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <button
          className="text-sm text-[#0B1F3B] flex items-center gap-2"
          onClick={() => setRawOpen((v) => !v)}
        >
          <span
            className={`transition-transform ${rawOpen ? "rotate-180" : ""}`}
          >
            ⌃
          </span>
          {rawOpen ? "Hide Raw Text Preview" : "Show Raw Text Preview"}
        </button>

        {rawOpen && (
          <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <pre className="whitespace-pre-wrap text-[12px] leading-5 text-gray-700">
              {rawText || "No raw text available"}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
