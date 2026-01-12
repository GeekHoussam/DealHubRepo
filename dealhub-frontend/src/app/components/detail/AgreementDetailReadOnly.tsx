import { AgreementVersion, ExtractionField } from "../../types";
import { Button } from "../Button";
import { exportCsv, exportJson } from "../../api/agreementsApi";
import { AgreementStatusBadge } from "../AgreementStatusBadge";

function fieldValue<T>(f?: ExtractionField<T> | null): string | undefined {
  const v = f?.value;
  if (v === null || v === undefined) return undefined;
  return String(v);
}

export function AgreementDetailReadOnly({
  version,
}: {
  version: AgreementVersion;
}) {
  const job = version.extractedJson;
  const result = job?.resultJson;

  if (!result) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-gray-700">No extracted result available yet.</p>
      </div>
    );
  }

  const borrower = fieldValue(result.parties?.borrowerName);
  const agent = fieldValue(result.parties?.administrativeAgentName);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Agreement (read-only)</p>
          <p className="text-lg font-semibold text-gray-900">
            Version #{version.id}
          </p>

          {version.validatedAt && (
            <p className="text-xs text-gray-500">
              Validated on {new Date(version.validatedAt).toLocaleString()}
              {version.validatedBy ? ` by ${version.validatedBy}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AgreementStatusBadge status={version.status} />
          <Button
            variant="outline"
            onClick={() => exportJson(String(version.agreementId))}
          >
            Download JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => exportCsv(String(version.agreementId))}
          >
            Download CSV
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <Field
          label="Borrower"
          value={borrower}
          evidence={result.parties?.borrowerName?.evidence}
        />
        <Field
          label="Administrative agent"
          value={agent}
          evidence={result.parties?.administrativeAgentName?.evidence}
        />

        <Field
          label="Agreement date"
          value={fieldValue(result.keyDates?.agreementDate)}
          evidence={result.keyDates?.agreementDate?.evidence}
        />
        <Field
          label="Maturity date"
          value={fieldValue(result.keyDates?.maturityDate)}
          evidence={result.keyDates?.maturityDate?.evidence}
        />

        <Field
          label="Base rate"
          value={fieldValue(result.pricing?.baseRate)}
          evidence={result.pricing?.baseRate?.evidence}
        />
        <Field
          label="Margin"
          value={fieldValue(result.pricing?.margin)}
          evidence={result.pricing?.margin?.evidence}
        />

        <div className="md:col-span-2">
          <p className="text-xs uppercase text-gray-500 mb-1">Facilities</p>
          <div className="space-y-2">
            {Array.isArray(result.facilities) && result.facilities.length > 0 ? (
              result.facilities.map((f, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <p className="font-semibold text-gray-800">
                    {fieldValue(f.facilityType) ?? "Facility"}
                  </p>
                  <p className="text-gray-600">{fieldValue(f.amount) ?? "—"}</p>
                  {f.amount?.evidence && (
                    <p className="mt-1 text-xs text-gray-500">
                      Evidence: “{f.amount.evidence}”
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No facilities available</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs uppercase text-gray-500 mb-1">Lenders</p>
          <div className="space-y-2">
            {Array.isArray(result.parties?.lenders) &&
            result.parties.lenders.length > 0 ? (
              result.parties.lenders.map((l, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <p className="font-semibold text-gray-800">
                    {fieldValue(l.name) ?? "Lender"}
                  </p>
                  <p className="text-gray-600">
                    {fieldValue(l.shareAmount) ?? "—"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {fieldValue(l.sharePercentage) ?? ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No lenders listed</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  evidence,
}: {
  label: string;
  value?: string;
  evidence?: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-500 mb-1">{label}</p>
      <p className="text-gray-800">{value || "—"}</p>
      {evidence && (
        <p className="mt-1 text-xs text-gray-500">Evidence: “{evidence}”</p>
      )}
    </div>
  );
}
