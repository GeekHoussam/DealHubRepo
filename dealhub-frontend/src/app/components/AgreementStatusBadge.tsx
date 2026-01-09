interface AgreementStatusBadgeProps {
  status: string;
}

export function AgreementStatusBadge({ status }: AgreementStatusBadgeProps) {
  const statusClass = {
    DRAFT: "text-yellow-500",
    VALIDATED: "text-green-500",
    EXTRACTED: "text-blue-500",
    FAILED: "text-red-500",
  }[status] || "text-gray-500";

  return <span className={`status-badge ${statusClass}`}>{status}</span>;
}
