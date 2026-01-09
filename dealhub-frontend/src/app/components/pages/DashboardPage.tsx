// src/pages/Dashboard/DashboardPage.tsx

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  listRecentAgreements,
  listHistoricalAgreements,
  validateVersionById,
  getVersionById,
} from "../../api/agreementsApi";

import type { AgreementRowDto } from "../../api/contracts";
import {
  getFacilitiesCount,
  getTotalFacilityAmount,
  formatMoneyCompact,
} from "../../../utils/extractedJsonMetrics";

type Tab = "recent" | "historical";

function pickExtractedJson(row: any): any {
  return (
    row?.latestVersion?.extractedJson ??
    row?.validatedVersion?.extractedJson ??
    row?.draftVersion?.extractedJson ??
    row?.extractedJson ??
    row?.__extractedJson ??
    null
  );
}

function pickAnyVersionId(row: any): number | null {
  // For view/edit: prefer draft, else validated, else latest
  const id =
    row?.latestDraftVersionId ??
    row?.draftVersionId ??
    row?.draftVersion?.id ??
    row?.latestValidatedVersionId ??
    row?.validatedVersionId ??
    row?.validatedVersion?.id ??
    row?.latestVersionId ??
    row?.latestVersion?.id ??
    null;

  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pickDraftVersionId(row: any): number | null {
  const id =
    row?.latestDraftVersionId ??
    row?.draftVersionId ??
    row?.draftVersion?.id ??
    null;

  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatUpdated(v: any): string {
  if (!v) return "—";
  const s = String(v);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  return s;
}

export default function DashboardPage() {
  const nav = useNavigate();

  const [tab, setTab] = useState<Tab>("recent");
  const [loading, setLoading] = useState(false);

  // Keep as AgreementRowDto[] (but we’ll still treat rows as any for flexibility)
  const [rows, setRows] = useState<AgreementRowDto[]>([]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Cache extractedJson by versionId (since we fetch by versionId)
  const [extractedCache, setExtractedCache] = useState<Record<number, any>>({});

  async function load() {
    setLoading(true);
    try {
      const data: AgreementRowDto[] =
        tab === "recent" ? await listRecentAgreements(14) : await listHistoricalAgreements(q);

      setRows(data);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load agreements", { description: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== "historical") return;
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Enrich rows using REAL endpoint: GET /agreements/versions/{versionId}
  useEffect(() => {
    (async () => {
      if (!rows || rows.length === 0) return;

      const missingVersionIds = rows
        .map((r: any) => pickAnyVersionId(r))
        .filter((id): id is number => typeof id === "number" && id > 0)
        .filter((versionId) => extractedCache[versionId] == null)
        .filter((versionId) => {
          const row = rows.find((x: any) => pickAnyVersionId(x) === versionId);
          return row ? !pickExtractedJson(row) : true;
        });

      if (missingVersionIds.length === 0) return;

      const updates: Record<number, any> = {};

      for (const versionId of missingVersionIds) {
        try {
          const v = await getVersionById(versionId);
          const extracted = (v as any)?.extractedJson ?? (v as any)?.extracted ?? null;
          if (extracted) updates[versionId] = extracted;
        } catch {
          // ignore per-row failures (non-blocking)
        }
      }

      if (Object.keys(updates).length) {
        setExtractedCache((prev) => ({ ...prev, ...updates }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, extractedCache]);

  // Apply cache into row-like object (without mutating original)
  const enrichedRows = useMemo(() => {
    return rows.map((r: any) => {
      const versionId = pickAnyVersionId(r);
      if (versionId && extractedCache[versionId] != null) {
        return { ...r, __extractedJson: extractedCache[versionId] };
      }
      return r;
    });
  }, [rows, extractedCache]);

  const filtered = useMemo(() => {
    let r = [...enrichedRows];

    if (statusFilter) {
      r = r.filter((x: any) => String(x?.status ?? "").toUpperCase() === statusFilter.toUpperCase());
    }

    // NOTE: Dashboard rows now use agreementName not name
    if (q.trim() && tab === "recent") {
      const qq = q.trim().toLowerCase();
      r = r.filter((x: any) => {
        const name = String(x?.agreementName ?? "").toLowerCase();
        const borrower = String(x?.borrower ?? "").toLowerCase();
        const agent = String(x?.agent ?? "").toLowerCase();
        return name.includes(qq) || borrower.includes(qq) || agent.includes(qq);
      });
    }

    return r;
  }, [enrichedRows, statusFilter, q, tab]);

  // Use versionId routes
  const onView = (row: any) => {
    const versionId = pickAnyVersionId(row);
    if (!versionId) {
      toast.error("No version available to view (missing versionId in dashboard row)");
      return;
    }
    nav(`/agreements/versions/${versionId}`);
  };

  const onEdit = (row: any) => {
    const versionId = pickAnyVersionId(row);
    if (!versionId) {
      toast.error("No version available to edit (missing versionId in dashboard row)");
      return;
    }
    nav(`/agreements/versions/${versionId}?mode=edit`);
  };

  const onParticipants = (row: any) => {
    // participants is agreement-based
    const agreementId = Number((row as any)?.agreementId);
    if (!agreementId) {
      toast.error("Missing agreementId");
      return;
    }
    nav(`/agreements/${agreementId}?tab=participants`);
  };

  const onReExtract = (row: any) => {
    const agreementId = Number((row as any)?.agreementId);
    if (!agreementId) {
      toast.error("Missing agreementId");
      return;
    }
    nav(`/extract?agreementId=${agreementId}`);
  };

  const onValidate = async (row: any) => {
    const draftVersionId = pickDraftVersionId(row);
    if (!draftVersionId) {
      toast.error("No draft version to validate");
      return;
    }
    try {
      await validateVersionById(draftVersionId);
      toast.success("Validated");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error("Validation failed", { description: e?.message ?? String(e) });
    }
  };

  return (
    <main className="p-6 max-w-[1440px] mx-auto">
      <div className="text-white mb-6">
        <h1 className="text-4xl font-semibold">Agreement Dashboard</h1>
        <p className="text-white/80 mt-1">Manage and review all facility agreements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/20 mb-6">
        <button
          className={`pb-2 text-sm ${tab === "recent" ? "text-white border-b-2 border-white" : "text-white/70"}`}
          onClick={() => setTab("recent")}
        >
          Recently Extracted (14d)
        </button>
        <button
          className={`pb-2 text-sm ${tab === "historical" ? "text-white border-b-2 border-white" : "text-white/70"}`}
          onClick={() => setTab("historical")}
        >
          Historical
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by agreement name, borrower, or agent..."
          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-3 text-sm"
        >
          <option value="">All Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="VALIDATED">VALIDATED</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>

        <button
          onClick={load}
          className="rounded-xl px-4 py-3 text-sm border border-gray-200 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 text-sm text-gray-600">
          {loading ? "Loading..." : `${filtered.length} agreement(s)`}
        </div>

        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">AGREEMENT NAME</th>
                <th className="text-left px-4 py-3">BORROWER</th>
                <th className="text-left px-4 py-3">AGENT</th>
                <th className="text-left px-4 py-3">FACILITIES</th>
                <th className="text-left px-4 py-3">TOTAL AMOUNT</th>
                <th className="text-left px-4 py-3">STATUS</th>
                <th className="text-left px-4 py-3">LAST UPDATED</th>
                <th className="text-left px-4 py-3">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((row: any) => {
                const extractedJson = pickExtractedJson(row);
                const facilitiesCount = getFacilitiesCount(extractedJson);
                const totalAmount = getTotalFacilityAmount(extractedJson);

                const status = String(row?.status ?? "");
                const updated = row?.lastUpdated ?? row?.updatedAt ?? row?.modifiedAt ?? "";

                const hasAnyVersion = !!pickAnyVersionId(row);

                const agreementId = Number(row?.agreementId);

                return (
                  <tr
                    key={String(row?.agreementId ?? row?.latestVersionId ?? Math.random())}
                    className="border-t border-gray-100"
                  >
                    <td className="px-4 py-4">{row?.agreementName ?? "—"}</td>
                    <td className="px-4 py-4">{row?.borrower ?? "—"}</td>
                    <td className="px-4 py-4">{row?.agent ?? "—"}</td>
                    <td className="px-4 py-4">{facilitiesCount}</td>
                    <td className="px-4 py-4">{formatMoneyCompact(totalAmount, "$")}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`font-medium ${
                          status === "VALIDATED"
                            ? "text-green-600"
                            : status === "DRAFT"
                            ? "text-orange-500"
                            : "text-gray-600"
                        }`}
                      >
                        {status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">{formatUpdated(updated)}</td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-[#0B1F3B] px-4 py-2 text-[#0B1F3B] hover:bg-[#0B1F3B]/5"
                          onClick={() => onView(row)}
                          disabled={!hasAnyVersion}
                        >
                          View
                        </button>

                        <button
                          className="rounded-full border border-[#0B1F3B] px-4 py-2 text-[#0B1F3B] hover:bg-[#0B1F3B]/5"
                          onClick={() => onReExtract(row)}
                          disabled={!agreementId}
                        >
                          Re-extract
                        </button>

                        <button
                          className="rounded-full border border-[#0B1F3B] px-4 py-2 text-[#0B1F3B] hover:bg-[#0B1F3B]/5"
                          onClick={() => onParticipants(row)}
                          disabled={!agreementId}
                        >
                          Participants
                        </button>

                        {String(status).toUpperCase() === "DRAFT" && (
                          <>
                            <button
                              className="rounded-full border border-[#0B1F3B] px-4 py-2 text-[#0B1F3B] hover:bg-[#0B1F3B]/5"
                              onClick={() => onEdit(row)}
                              disabled={!hasAnyVersion}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-full border border-[#0B1F3B] px-4 py-2 text-[#0B1F3B] hover:bg-[#0B1F3B]/5"
                              onClick={() => onValidate(row)}
                            >
                              Validate
                            </button>
                          </>
                        )}
                      </div>

                      {!pickExtractedJson(row) && (
                        <div className="text-[11px] text-gray-400 mt-2">
                          Metrics will load when version data is available.
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-gray-500" colSpan={8}>
                    No agreements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
