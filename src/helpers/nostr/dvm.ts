import { isETag } from "applesauce-core/helpers";
import { safeParse } from "applesauce-core/helpers/json";
import { NostrEvent } from "nostr-tools";

export const DVM_STATUS_KIND = 7000;

export const DVM_TRANSLATE_JOB_KIND = 5002;
export const DVM_TRANSLATE_RESULT_KIND = 6002;

export const DVM_TTS_JOB_KIND = 5250;
export const DVM_TTS_RESULT_KIND = 6250;

export const DVM_CONTENT_DISCOVERY_JOB_KIND = 5300;
export const DVM_CONTENT_DISCOVERY_RESULT_KIND = 6300;

type DVMMetadata = {
  name?: string;
  about?: string;
  image?: string;
  nip90Params?: Record<string, { required: boolean; values: string[] }>;
};
export function parseDVMMetadata(event: NostrEvent) {
  const metadata = safeParse(event.content) || {};
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

export function getRequestInputParam(e: NostrEvent, k: string): string;
export function getRequestInputParam(e: NostrEvent, k: string, required: true): string;
export function getRequestInputParam(e: NostrEvent, k: string, required: false): string | undefined;
export function getRequestInputParam(e: NostrEvent, k: string, required: boolean = true) {
  const value = getRequestInputParams(e, k)[0];
  if (value === undefined && required) throw new Error(`Missing ${k} param`);
  return value;
}

export function getResponseFromDVM(job: DVMJob, pubkey: string) {
  return job.responses.find((r) => r.pubkey === pubkey);
}
export function getResultEventIds(result: NostrEvent) {
  const parsed = JSON.parse(result.content);
  if (!Array.isArray(parsed)) return [];
  const tags = parsed as string[][];
  return tags.filter(isETag).map((t) => t[1]);
}

export type DVMResponse = { pubkey: string; result?: NostrEvent; status?: NostrEvent };
export type DVMJob = { request: NostrEvent; responses: DVMResponse[] };
export type ChainedDVMJob = DVMJob & { next: ChainedDVMJob[]; prevId?: string; prev?: ChainedDVMJob };

export function getJobStatusType(job: DVMJob, dvm?: string) {
  const response = dvm ? job.responses[0] : job.responses.find((r) => r.pubkey === dvm);
  return response?.status?.tags.find((t) => t[0] === "status")?.[1];
}

export function groupEventsIntoJobs(events: NostrEvent[]) {
  const jobs: Record<string, DVMJob> = {};
  for (const event of events) {
    if (event.kind >= 5000 && event.kind < 6000) jobs[event.id] = { request: event, responses: [] };
  }

  for (const event of events) {
    // skip requests
    if (event.kind >= 5000 && event.kind < 6000) continue;

    const requestId = event.tags.find(isETag)?.[1];
    if (!requestId) continue;
    const job = jobs[requestId];
    if (!job) continue;

    let response = job.responses.find((r) => r.pubkey === event.pubkey);
    if (!response) {
      response = { pubkey: event.pubkey };
      job.responses.push(response);
    }

    if (event.kind >= 6000 && event.kind < 7000) {
      if (!response.result || response.result.created_at < event.created_at) response.result = event;
    } else if (event.kind === DVM_STATUS_KIND) {
      if (!response.status || response.status.created_at < event.created_at) response.status = event;
    }
  }

  return jobs;
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
  return jobs.map((j) => j.responses?.map((r) => (r.result ? getResultEventIds(r.result) : [])).flat()).flat();
}
