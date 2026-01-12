import { File } from "lucide-react";
import { UploadBox } from "./UploadBox";
import { StatusBadge } from "./StatusBadge";
import { KeyValueItem } from "./KeyValueItem";
import { Button } from "./Button";
import type { BorrowerDto } from "../api/borrowersApi";

interface UploadCardProps {
  fileName: string | null;
  status: "ready" | "extracting" | "extracted";

  dealSummary: {
    dealName: string;
    borrower: string;
    agent: string;
  } | null;

  borrowers: BorrowerDto[];
  borrowersLoading: boolean;
  borrowerId: number | "";
  onBorrowerChange: (value: number | "") => void;

  onFileSelect: (file: File) => void;
  onExtract: () => void;
}

export function UploadCard({
  fileName,
  status,
  dealSummary,
  borrowers,
  borrowersLoading,
  borrowerId,
  onBorrowerChange,
  onFileSelect,
  onExtract,
}: UploadCardProps) {
  return (
    <div className="w-[380px] bg-white rounded-xl shadow-sm p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-base mb-1.5 text-[#0B1F3B]">
          Upload Facility Agreement
        </h2>
        <p className="text-[13px] text-gray-500">
          Upload a PDF for reference. Agreement/document IDs are handled
          automatically (Swagger flow).
        </p>
      </div>

      {/* Borrower dropdown */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-600">Borrower</span>
        <select
          value={borrowerId === "" ? "" : String(borrowerId)}
          onChange={(e) => {
            const v = e.target.value;
            onBorrowerChange(v ? Number(v) : "");
          }}
          disabled={borrowersLoading || status === "extracting"}
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/30"
        >
          {borrowersLoading ? (
            <option value="">Loading...</option>
          ) : (
            <>
              {borrowers.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </>
          )}
        </select>
      </label>

      <UploadBox
        onFileSelect={onFileSelect}
        disabled={status === "extracting"}
      />

      {fileName && (
        <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
          <File className="w-4 h-4" />
          <span>{fileName}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Status:</span>
        <StatusBadge status={status} />
      </div>

      <div className="h-px bg-gray-200" />

      <div>
        <h3 className="text-sm mb-3 text-[#0B1F3B]">Deal Summary (preview)</h3>
        {dealSummary ? (
          <div className="space-y-1">
            <KeyValueItem label="Deal name" value={dealSummary.dealName} />
            <KeyValueItem label="Borrower" value={dealSummary.borrower} />
            <KeyValueItem label="Agent" value={dealSummary.agent} />
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-4 text-center">
            No data available
          </p>
        )}
      </div>

      <Button
        variant="primary"
        onClick={onExtract}
        disabled={status === "extracting" || status === "extracted"}
        className="h-11 w-full"
      >
        {status === "extracting" ? "Extracting..." : "Extract"}
      </Button>

      <p className="text-[11px] text-gray-500 text-center">
        Extraction results will appear on the right
      </p>
    </div>
  );
}
