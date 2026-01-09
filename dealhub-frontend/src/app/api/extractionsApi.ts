import { httpJson } from "./http";
import type { ExtractionResponse, StartExtractionRequest } from "./contracts";

export type PollOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
};

function extractJobKey(r: ExtractionResponse): string {
  // backend may return jobKey OR id OR key
  const key = r.jobKey ?? r.id ?? r.key;
  if (!key) throw new Error("ExtractionResponse missing job key (jobKey/id/key)");
  return String(key);
}

/**
 * Start extraction job (Business contract: returns jobKey).
 */
export async function startExtraction(
  req: StartExtractionRequest
): Promise<{ jobKey: string; response: ExtractionResponse }> {
  const response = await httpJson<ExtractionResponse>("POST", "/extractions/start", req);
  return { jobKey: extractJobKey(response), response };
}

/**
 * Get job state by jobKey.
 */
export async function getExtraction(jobKey: string): Promise<ExtractionResponse> {
  return httpJson<ExtractionResponse>("GET", `/extractions/${encodeURIComponent(jobKey)}`);
}

/**
 * Poll until terminal status or timeout.
 */
export async function pollExtraction(jobKey: string, opts: PollOptions = {}): Promise<ExtractionResponse> {
  const intervalMs = opts.intervalMs ?? 1500;
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const startedAt = Date.now();

  const sleep = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      opts.signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(t);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true }
      );
    });

  while (true) {
    if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const job = await getExtraction(jobKey);
    const status = String(job.status ?? "").toUpperCase();

    // adapt if your backend uses different names
    const doneStatuses = new Set(["COMPLETED", "DONE", "SUCCESS", "SUCCEEDED"]);
    const failedStatuses = new Set(["FAILED", "ERROR"]);

    if (doneStatuses.has(status) || failedStatuses.has(status)) return job;

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Extraction polling timed out after ${timeoutMs}ms (jobKey=${jobKey})`);
    }

    await sleep(intervalMs);
  }
}
