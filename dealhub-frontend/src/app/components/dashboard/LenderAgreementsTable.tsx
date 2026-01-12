import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AgreementsTable } from "./AgreementsTable";
import type { AgreementSummary } from "../../types";
import { listHistoricalAgreementSummaries } from "../../api/agreementsApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function LenderAgreementsTable() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AgreementSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const rows = await listHistoricalAgreementSummaries(search);
        setData(rows);
      } catch {
        toast.error("Failed to load lender agreements");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search]);

  const validatedOnly = useMemo(
    () => data.filter((x) => x.status === "VALIDATED"),
    [data]
  );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by deal name or borrower"
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
        <p className="text-sm text-gray-500">Showing validated agreements</p>
      </div>

      <AgreementsTable
        data={validatedOnly}
        onView={(id) => navigate(`/agreements/${id}`)}
        role="LENDER"
        isLoading={loading}
        emptyMessage="No validated agreements found"
        showCommitment
      />
    </div>
  );
}
