import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import {
  getVersionById,
  getDraftVersion,
  getValidatedVersion,
  patchVersion,
  validateVersionById,
  publishVersion,
  exportJson,
  exportCsv,
} from "../../api/agreementsApi";

type Tab = "draft" | "validated";

function safeJsonStringify(v: any) {
  try {
    return JSON.stringify(v ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function safeParse(text: string) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return null;
  }
}

function pickJsonFromVersion(v: any) {
  return (
    v?.extractedJson ??
    v?.extractedJSON ??
    v?.extracted_json ??
    v?.payload ??
    v?.data ??
    {}
  );
}

export default function AgreementDetailPage() {
  const nav = useNavigate();
  const { id, versionId } = useParams();
  const [sp] = useSearchParams();

  const mode = sp.get("mode");
  const initialTab = (sp.get("tab") as Tab | null) ?? null;
  const showParticipants = sp.get("tab") === "participants";

  const [tab, setTab] = useState<Tab>("draft");
  const [agreementId, setAgreementId] = useState<number | null>(null);

  const [draftVersion, setDraftVersion] = useState<any | null>(null);
  const [validatedVersion, setValidatedVersion] = useState<any | null>(null);

  const [editorText, setEditorText] = useState<string>("{}");

  const [busySave, setBusySave] = useState(false);
  const [busyValidate, setBusyValidate] = useState(false);
  const [busyPublish, setBusyPublish] = useState(false);

  const canEditDraft = mode === "edit";

  const agreementIdFromRoute = Number(id);
  const versionIdFromRoute = Number(versionId);

  async function loadByVersion(vId: number) {
    try {
      const v = await getVersionById(vId);

      const aId = Number((v as any)?.agreementId);
      if (Number.isFinite(aId) && aId > 0) setAgreementId(aId);

      const status = String((v as any)?.status ?? "").toUpperCase();
      if (status === "VALIDATED" || status === "PUBLISHED") {
        setValidatedVersion(v);
        setDraftVersion(null);
        setTab("validated");
      } else {
        setDraftVersion(v);
        setValidatedVersion(null);
        setTab("draft");
      }

      const payload = pickJsonFromVersion(v);
      setEditorText(safeJsonStringify(payload));
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load version", {
        description: e?.message ?? String(e),
      });
    }
  }

  async function loadByAgreement(aId: number) {
    try {
      setAgreementId(aId);

      const [d, v] = await Promise.allSettled([
        getDraftVersion(aId),
        getValidatedVersion(aId),
      ]);

      const draft = d.status === "fulfilled" ? d.value : null;
      const validated = v.status === "fulfilled" ? v.value : null;

      setDraftVersion(draft);
      setValidatedVersion(validated);

      if (mode === "edit") setTab("draft");
      else if (initialTab === "validated") setTab("validated");

      const payload = pickJsonFromVersion(draft);
      setEditorText(safeJsonStringify(payload));
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load agreement versions", {
        description: e?.message ?? String(e),
      });
    }
  }

  useEffect(() => {
    if (Number.isFinite(versionIdFromRoute) && versionIdFromRoute > 0) {
      loadByVersion(versionIdFromRoute);
      return;
    }

    if (Number.isFinite(agreementIdFromRoute) && agreementIdFromRoute > 0) {
      loadByAgreement(agreementIdFromRoute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, versionId]);

  const currentVersion = tab === "draft" ? draftVersion : validatedVersion;
  const currentVersionId = Number(currentVersion?.id) || null;
  const currentStatus = String(currentVersion?.status ?? "");

  const parsedEditorJson = useMemo(() => safeParse(editorText), [editorText]);

  const validatedJson = useMemo(() => {
    return pickJsonFromVersion(validatedVersion);
  }, [validatedVersion]);

  const hasDraft = !!draftVersion?.id;
  const hasValidated = !!validatedVersion?.id;

  const canSave = hasDraft && tab === "draft" && canEditDraft;
  const canValidate = hasDraft;
  const canPublish = hasValidated;

  const onSavePatch = async () => {
    if (!draftVersion?.id) {
      toast.error("No draft version to save");
      return;
    }
    if (!canEditDraft) {
      toast.error("Read-only", {
        description: "Open with ?mode=edit to edit draft JSON.",
      });
      return;
    }
    if (!parsedEditorJson) {
      toast.error("Invalid JSON", {
        description: "Fix JSON syntax before saving.",
      });
      return;
    }

    setBusySave(true);
    try {
      const updated = await patchVersion(
        agreementId ?? 0,
        draftVersion.id,
        parsedEditorJson
      );
      setDraftVersion(updated);
      toast.success("Draft saved");

      const payload = pickJsonFromVersion(updated) ?? parsedEditorJson ?? {};
      setEditorText(safeJsonStringify(payload));
    } catch (e: any) {
      console.error(e);
      toast.error("Save failed", { description: e?.message ?? String(e) });
    } finally {
      setBusySave(false);
    }
  };

  const onValidateDraft = async () => {
    if (!draftVersion?.id) {
      toast.error("No draft version to validate");
      return;
    }
    setBusyValidate(true);
    try {
      await validateVersionById(draftVersion.id);
      toast.success("Validated");

      await loadByVersion(draftVersion.id);
      setTab("validated");
    } catch (e: any) {
      console.error(e);
      toast.error("Validation failed", {
        description: e?.message ?? String(e),
      });
    } finally {
      setBusyValidate(false);
    }
  };

  const onPublishValidated = async () => {
    if (!validatedVersion?.id) {
      toast.error("No validated version to publish", {
        description: "Validate the draft first.",
      });
      return;
    }

    setBusyPublish(true);
    try {
      await publishVersion(validatedVersion.id);
      toast.success("Published");

      await loadByVersion(validatedVersion.id);
      setTab("validated");

      nav("/dashboard");
    } catch (e: any) {
      console.error(e);
      toast.error("Publish failed", { description: e?.message ?? String(e) });
    } finally {
      setBusyPublish(false);
    }
  };

  const onExportJson = async () => {
    const payload =
      tab === "draft" ? parsedEditorJson ?? {} : validatedJson ?? {};
    await exportJson(currentVersionId ?? agreementId ?? "agreement", payload);
  };

  const onExportCsv = async () => {
    const payload =
      tab === "draft" ? parsedEditorJson ?? {} : validatedJson ?? {};
    await exportCsv(currentVersionId ?? agreementId ?? "agreement", payload);
  };

  return (
    <main className="p-6 max-w-[1440px] mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="text-white">
          <h1 className="text-3xl font-semibold">
            Agreement #{agreementId ?? agreementIdFromRoute ?? "—"}{" "}
            <span className="text-white/60 text-sm">
              (version #{currentVersionId ?? versionIdFromRoute ?? "—"})
            </span>
          </h1>

          {showParticipants && (
            <p className="text-white/70 text-sm mt-1">
              Participants view is not implemented on this page yet (redirected
              from Dashboard).
            </p>
          )}

          {mode !== "edit" && (
            <p className="text-white/60 text-sm mt-1">
              Tip: open <span className="font-mono">?mode=edit</span> to enable
              draft editing.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-xl px-4 py-2 bg-white/10 text-white hover:bg-white/15 disabled:opacity-60"
            onClick={onSavePatch}
            disabled={busySave || !canSave}
            title={
              !canEditDraft
                ? "Open with ?mode=edit to enable editing"
                : undefined
            }
          >
            {busySave ? "Saving..." : "Save (patch)"}
          </button>

          <button
            className="rounded-xl px-4 py-2 bg-white/10 text-white hover:bg-white/15 disabled:opacity-60"
            onClick={onValidateDraft}
            disabled={busyValidate || !canValidate}
          >
            {busyValidate ? "Validating..." : "Validate Draft"}
          </button>

          <button
            className="rounded-xl px-4 py-2 bg-white/10 text-white hover:bg-white/15 disabled:opacity-60"
            onClick={onPublishValidated}
            disabled={busyPublish || !canPublish}
            title={
              !hasValidated
                ? "Validate first to create a validated version"
                : undefined
            }
          >
            {busyPublish ? "Publishing..." : "Publish Validated"}
          </button>

          <button
            className="rounded-xl px-4 py-2 bg-white/10 text-white hover:bg-white/15"
            onClick={onExportJson}
          >
            Export JSON
          </button>

          <button
            className="rounded-xl px-4 py-2 bg-white/10 text-white hover:bg-white/15"
            onClick={onExportCsv}
          >
            Export CSV
          </button>

          <button
            className="rounded-xl px-4 py-2 bg-white/10 text-white hover:bg-white/15"
            onClick={() => nav("/dashboard")}
          >
            Back
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg ${
            tab === "draft"
              ? "bg-white text-[#0B1F3B]"
              : "bg-white/10 text-white"
          }`}
          onClick={() => {
            setTab("draft");
            const payload = pickJsonFromVersion(draftVersion);
            setEditorText(safeJsonStringify(payload));
          }}
          disabled={!draftVersion}
          title={!draftVersion ? "No draft loaded" : undefined}
        >
          Draft
        </button>

        <button
          className={`px-4 py-2 rounded-lg ${
            tab === "validated"
              ? "bg-white text-[#0B1F3B]"
              : "bg-white/10 text-white"
          }`}
          onClick={() => setTab("validated")}
          disabled={!validatedVersion}
          title={!validatedVersion ? "No validated version yet" : undefined}
        >
          Validated
        </button>
      </div>

      <div className="bg-white/10 rounded-2xl p-5 text-white">
        <div className="text-sm text-white/80 mb-2">
          Status:{" "}
          <span className="font-semibold text-white">
            {currentStatus || "—"}
          </span>
        </div>

        {tab === "draft" ? (
          <textarea
            value={editorText}
            onChange={(e) => setEditorText(e.target.value)}
            readOnly={!canEditDraft}
            className={`w-full min-h-[520px] rounded-xl bg-[#0B1F3B]/60 border border-white/10 p-4 font-mono text-[12px] leading-5 outline-none ${
              !canEditDraft ? "opacity-80 cursor-not-allowed" : ""
            }`}
          />
        ) : (
          <pre className="w-full min-h-[520px] rounded-xl bg-[#0B1F3B]/60 border border-white/10 p-4 overflow-auto font-mono text-[12px] leading-5">
            {safeJsonStringify(validatedJson)}
          </pre>
        )}
      </div>
    </main>
  );
}
