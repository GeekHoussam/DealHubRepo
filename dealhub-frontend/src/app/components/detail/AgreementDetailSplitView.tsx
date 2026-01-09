import { useMemo, useState } from "react";
import { AgreementVersion } from "../../types";
import { RawTextPreview } from "../RawTextPreview";
import { Button } from "../Button";
import { FieldEditorForm } from "./FieldEditorForm";
import { AgreementStatusBadge } from "../AgreementStatusBadge";

interface AgreementDetailSplitViewProps {
  version: AgreementVersion;
  onSave: (payload: any) => Promise<void>;
  onValidate: () => Promise<void>;
  saving: boolean;
  validating: boolean;
}

export function AgreementDetailSplitView({
  version,
  onSave,
  onValidate,
  saving,
  validating,
}: AgreementDetailSplitViewProps) {
  const [showJson, setShowJson] = useState(false);
  const isDraft = version.status === "DRAFT";

  const extractedFields = useMemo(
    () => version.extractedJson?.resultJson ?? {},
    [version.extractedJson]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Raw text</h3>
          <AgreementStatusBadge status={version.status} />
        </header>
        <RawTextPreview text={version.rawText || "No raw text available"} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Extracted fields</h3>
            {version.validatedAt && (
              <p className="text-xs text-gray-500">
                Validated on {new Date(version.validatedAt).toLocaleString()}{" "}
                {version.validatedBy ? `by ${version.validatedBy}` : ""}
              </p>
            )}
          </div>

          <Button variant="outline" className="text-sm" onClick={() => setShowJson((p) => !p)}>
            {showJson ? "Hide JSON" : "Show JSON"}
          </Button>
        </header>

        {isDraft ? (
          <FieldEditorForm
            data={extractedFields as any}
            onSave={onSave}
            onValidate={onValidate}
            saving={saving}
            validating={validating}
          />
        ) : (
          <div className="text-sm text-gray-700">
            This version is validated and read-only.
          </div>
        )}

        {showJson && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <pre className="text-xs text-gray-700 overflow-auto max-h-64">
              {JSON.stringify(extractedFields, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
