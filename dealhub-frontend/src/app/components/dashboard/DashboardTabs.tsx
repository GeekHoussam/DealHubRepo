import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { AgreementsTable } from "./AgreementsTable";
import { AgreementSummary, AgreementStatus } from "../../types";
import { listRecentAgreements, listHistoricalAgreements } from "../../api/agreementsApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import type { AgreementRowDto } from "../../api/contracts";

type TabKey = "recent" | "historical";

/**
 * Backend sends totalAmount as a string for hackathon UX (ex: "EUR 50,000,000").
 * UI expects a number, so we extract digits safely.
 */
function parseTotalAmount(totalAmount: unknown): number {
  if (typeof totalAmount !== "string") return 0;

  // Keep digits, dot, comma; remove currency and spaces
  // Examples supported:
  // "EUR 50,000,000" -> 50000000
  // "USD 12.5m" (won't be perfect, but returns 12.5)
  // "50 000 000" -> 50000000
  const cleaned = totalAmount
    .replace(/[^\d.,-]/g, "") // keep digits and separators
    .trim();

  if (!cleaned) return 0;

  // Handle common thousand separators:
  // If both comma and dot exist, assume comma = thousands, dot = decimals (e.g. 1,234.56)
  // If only comma exists, assume comma = thousands (e.g. 50,000,000)
  // If only dot exists, could be decimals or thousands; parseFloat handles "50000000" and "12.5"
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;

  if (hasComma && hasDot) {
    normalized = cleaned.replace(/,/g, "");
  } else if (hasComma && !hasDot) {
    normalized = cleaned.replace(/,/g, "");
  } else {
    // only dot or none: keep as-is
    normalized = cleaned;
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function toAgreementSummary(row: AgreementRowDto): AgreementSummary {
  // IMPORTANT: backend record fields are:
  // agreementId, agreementName, borrower, agent, facilitiesCount, totalAmount (string), status, lastUpdated, validatedAt

  const id = row.agreementId != null ? String(row.agreementId) : "";

  return {
    id,
    name: row.agreementName ?? (id ? `Agreement #${id}` : "Agreement"),
    borrower: row.borrower ?? "",
    agent: row.agent ?? "—",
    facilitiesCount: typeof row.facilitiesCount === "number" ? row.facilitiesCount : 0,
    totalAmount: parseTotalAmount(row.totalAmount),
    status: ((row.status ?? "DRAFT") as unknown) as AgreementStatus,
    updatedAt: row.lastUpdated ? String(row.lastUpdated) : "",
    validatedAt: row.validatedAt ? String(row.validatedAt) : undefined,
  };
}

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("recent");
  const [recentData, setRecentData] = useState<AgreementSummary[]>([]);
  const [historicalData, setHistoricalData] = useState<AgreementSummary[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [historicalLoading, setHistoricalLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"ALL" | AgreementStatus>("ALL");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  // Keep role as-is from backend (ADMIN / AGENT / LENDER)
  const role = (user?.role as any) ?? "AGENT";

  useEffect(() => {
    const fetchRecent = async () => {
      setRecentLoading(true);
      try {
        const rows = await listRecentAgreements(14);
        setRecentData(rows.map(toAgreementSummary));
      } catch {
        toast.error("Failed to load recent agreements");
      } finally {
        setRecentLoading(false);
      }
    };
    fetchRecent();
  }, []);

  useEffect(() => {
    const fetchHistorical = async () => {
      setHistoricalLoading(true);
      try {
        const rows = await listHistoricalAgreements(search);
        setHistoricalData(rows.map(toAgreementSummary));
      } catch {
        toast.error("Failed to load historical agreements");
      } finally {
        setHistoricalLoading(false);
      }
    };
    fetchHistorical();
  }, [search]);

  const filteredRecent = useMemo(() => {
    const base = recentData;
    if (statusFilter === "ALL") return base;
    return base.filter((x) => x.status === statusFilter);
  }, [recentData, statusFilter]);

  const filteredHistorical = useMemo(() => {
    const base = historicalData;
    if (statusFilter === "ALL") return base;
    return base.filter((x) => x.status === statusFilter);
  }, [historicalData, statusFilter]);

  const handleView = (id: string) => navigate(`/agreements/${id}`);

  /**
   * Re-extract cannot be done from this screen because backend endpoint is:
   * POST /extractions/start  (needs { agreementId, documentId })
   * So we route user to the agreement page where upload/start extraction happens.
   */
  const handleReextract = async (id: string) => {
    navigate(`/agreements/${id}?action=reextract`);
    toast.info("Upload a new document to re-run extraction");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/30 flex gap-8">
        <TabButton
          label="Recently Extracted (14d)"
          active={activeTab === "recent"}
          onClick={() => setActiveTab("recent")}
        />
        <TabButton
          label="Historical"
          active={activeTab === "historical"}
          onClick={() => setActiveTab("historical")}
        />
      </div>

      <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl shadow-blue-900/20 border border-white/40 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px] px-4 py-3 border border-gray-200 rounded-lg">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by agreement name, borrower, or agent..."
            className="w-full bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
          />
        </div>

        <button
          type="button"
          onClick={() => toast.info("Additional filters coming soon")}
          className="p-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          aria-label="Open filters"
        >
          <Filter className="w-5 h-5" />
        </button>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 bg-white min-w-[140px] shadow-sm"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="VALIDATED">Validated</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      <AgreementsTable
        data={activeTab === "recent" ? filteredRecent : filteredHistorical}
        onView={handleView}
        onEdit={handleView}
        onValidate={handleView}
        onReextract={handleReextract}
        onManageParticipants={(id) => toast.info(`Participants management coming soon for #${id}`)}
        role={role}
        isLoading={activeTab === "recent" ? recentLoading : historicalLoading}
        emptyMessage="No agreements found matching your criteria"
      />
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-3 text-sm font-semibold transition border-b-2 ${
        active ? "text-white border-white" : "text-blue-100 border-transparent hover:text-white hover:border-white/70"
      }`}
    >
      {label}
    </button>
  );
}
