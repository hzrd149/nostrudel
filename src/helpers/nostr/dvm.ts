import { NostrEvent, Tag, isETag } from "../../types/nostr-event";
import { safeJson } from "../parse";

export const DMV_STATUS_KIND = 7000;

export const DMV_TRANSLATE_JOB_KIND = 5002;
export const DMV_TRANSLATE_RESULT_KIND = 6002;

export const DMV_CONTENT_DISCOVERY_JOB_KIND = 5300;
export const DMV_CONTENT_DISCOVERY_RESULT_KIND = 6300;

type DVMMetadata = {
  name?: string;
  about?: string;
  image?: string;
  nip90Params?: Record<string, { required: boolean; values: string[] }>;
};
export function parseDVMMetadata(event: NostrEvent) {
  const metadata = safeJson(event.content, {});
  return metadata as DVMMetadata;
}

export function getRequestInputTag(e: NostrEvent) {
  return e.tags.find((t) => t[0] === "i");
}

export function getRequestInput(e: NostrEvent) {
  const tag = getRequestInputTag(e);
  if (!tag) return null;
  const [_, value, type, relay, marker] = tag;
  if (!value) throw new Error("Missing input value");
  if (!type) throw new Error("Missing input type");
  return { value, type, relay, marker };
}
export function getRequestRelays(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "relays")?.slice(1) ?? [];
}
export function getRequestOutputType(event: NostrEvent): string | undefined {
  return event.tags.find((t) => t[0] === "output")?.[1];
}

export function getRequestInputParams(e: NostrEvent, k: string) {
  return e.tags.filter((t) => t[0] === "param" && t[1] === k).map((t) => t[2]);
}

export function getRequestInputParam(e: NostrEvent, k: string) {
  const value = getRequestInputParams(e, k)[0];
  if (value === undefined) throw new Error(`Missing ${k} param`);
  return value;
}

export function getResultEventIds(result: NostrEvent) {
  const parsed = JSON.parse(result.content);
  if (!Array.isArray(parsed)) return [];
  const tags = parsed as Tag[];
  return tags.filter(isETag).map((t) => t[1]);
}

export type DVMJob = { request: NostrEvent; result?: NostrEvent; status?: NostrEvent };
export type ChainedDVMJob = DVMJob & { next: ChainedDVMJob[]; prevId?: string; prev?: ChainedDVMJob };

export function getJobStatusType(job: DVMJob) {
  return job.status?.tags.find((t) => t[0] === "status")?.[1];
}

export function groupEventsIntoJobs(events: NostrEvent[]) {
  const requests: Record<string, DVMJob> = {};
  for (const event of events) {
    if (event.kind === DMV_CONTENT_DISCOVERY_JOB_KIND) requests[event.id] = { request: event };
  }
  for (const event of events) {
    if (event.kind === DMV_CONTENT_DISCOVERY_RESULT_KIND) {
      const requestId = event.tags.find(isETag)?.[1];
      if (!requestId || !requests[requestId]) continue;
      requests[requestId].result = event;
    } else if (event.kind === DMV_STATUS_KIND) {
      const requestId = event.tags.find(isETag)?.[1];
      if (!requestId || !requests[requestId]) continue;
      requests[requestId].status = event;
    }
  }

  return requests;
}

export function chainJobs(jobs: DVMJob[]) {
  const chainedJobs: Record<string, ChainedDVMJob> = {};
  for (const job of jobs) {
    const input = getRequestInput(job.request);
    const prevId = input?.type === "event" ? input.value : undefined;
    chainedJobs[job.request.id] = { ...job, next: [], prevId };
  }

  // link jobs
  for (const job of Object.values(chainedJobs)) {
    if (job.prevId) {
      const prev = chainedJobs[job.prevId];
      if (prev) {
        prev.next.push(job);
        job.prev = prev;
      }
    }
  }

  const rootJobs: ChainedDVMJob[] = Object.values(chainedJobs)
    .filter((job) => !job.prevId)
    .sort((a, b) => b.request.created_at - a.request.created_at);

  return rootJobs;
}

export function flattenJobChain(jobs: ChainedDVMJob[]) {
  const feeds = Object.values(jobs)
    .filter((page) => !page.prevId)
    .map((root) => {
      const pages: ChainedDVMJob[] = [];

      let i = root;
      while (i) {
        pages.push(i);
        i = i.next[0];
      }

      return pages;
    })
    .sort((a, b) => b[0].request.created_at - a[0].request.created_at);

  return feeds;
}

export function getEventIdsFromJobs(jobs: ChainedDVMJob[]) {
  return jobs.map((p) => (p.result ? getResultEventIds(p.result) : [])).flat();
}
