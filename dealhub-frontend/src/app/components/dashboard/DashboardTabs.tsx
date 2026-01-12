import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { AgreementsTable } from "./AgreementsTable";
import { AgreementSummary, AgreementStatus } from "../../types";
import {
  listRecentAgreementSummaries,
  listHistoricalAgreementSummaries,
} from "../../api/agreementsApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import type { AgreementRowDto } from "../../api/contracts";

type TabKey = "recent" | "historical";

function parseTotalAmount(totalAmount: unknown): number {
  if (typeof totalAmount !== "string") return 0;

  const cleaned = totalAmount.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned) return 0;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;

  if (hasComma && hasDot) normalized = cleaned.replace(/,/g, "");
  else if (hasComma && !hasDot) normalized = cleaned.replace(/,/g, "");
  else normalized = cleaned;

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function toAgreementSummary(row: AgreementRowDto): AgreementSummary {
  const id = row.agreementId != null ? String(row.agreementId) : "";

  return {
    id,
    name: row.agreementName ?? (id ? `Agreement #${id}` : "Agreement"),
    borrower: row.borrower ?? "",
    agent: row.agent ?? "—",
    facilitiesCount:
      typeof row.facilitiesCount === "number" ? row.facilitiesCount : 0,
    totalAmount: parseTotalAmount(row.totalAmount),
    status: (row.status ?? "DRAFT") as unknown as AgreementStatus,
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

  const [statusFilter, setStatusFilter] = useState<"ALL" | AgreementStatus>(
    "ALL"
  );
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  const role = (user?.role as any) ?? "AGENT";

  useEffect(() => {
    const fetchRecent = async () => {
      setRecentLoading(true);
      try {
        const rows = await listRecentAgreementSummaries(14);
        setRecentData(rows);
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
        const rows = await listHistoricalAgreementSummaries(search);
        setHistoricalData(rows);
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
        onManageParticipants={(id) =>
          toast.info(`Participants management coming soon for #${id}`)
        }
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
        active
          ? "text-white border-white"
          : "text-blue-100 border-transparent hover:text-white hover:border-white/70"
      }`}
    >
      {label}
    </button>
  );
}
