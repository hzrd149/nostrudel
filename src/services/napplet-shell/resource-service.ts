import { getWindowIdentity, hasApprovedCapability, type NappletIdentity } from "./permissions";

const MAX_RESOURCE_BYTES = 25 * 1024 * 1024;
const MAX_RESOURCE_URLS = 16;
const MAX_CONCURRENT_RESOURCE_FETCHES = 4;

function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  const chunk = 32768;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function requestIdFromMessage(message: any) {
  if (typeof message.id === "string" && message.id.length > 0) return message.id;
  if (typeof message.requestId === "string" && message.requestId.length > 0) return message.requestId;
  return null;
}

function sendResourceError(send: (message: any) => void, requestId: string, code: string, message: string) {
  send({
    type: "resource.bytes.error",
    id: requestId,
    requestId,
    code,
    message,
    error: code === "denied" ? "blocked-by-policy" : code === "invalid-url" ? "invalid-request" : "network-error",
  });
}

function resourceRequestKey(windowId: string, requestId: string) {
  return `${windowId}:${requestId}`;
}

function getContentLength(headers: Headers) {
  const value = headers.get("content-length");
  if (!value) return undefined;

  const length = Number(value);
  return Number.isFinite(length) ? length : undefined;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = Array.from<R>({ length: items.length });
  let index = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const current = index++;
        results[current] = await mapper(items[current]);
      }
    }),
  );

  return results;
}

export type ResourceServiceOptions = { getBlossomOrigins: () => string[] };

// Allows a request when the napplet holds the approved resource:fetch capability, or when the
// requested origin is one of the user's configured Blossom servers. This is the gate deciding
// whether a sandboxed napplet may pull bytes from an arbitrary origin — moved verbatim, same two
// operands, neither inverted.
function isResourceRequestAllowed(identity: NappletIdentity, origin: string, options: ResourceServiceOptions) {
  return hasApprovedCapability(identity, "resource:fetch") || options.getBlossomOrigins().includes(origin);
}

function trackResourceRequest(
  inFlight: Map<string, AbortController>,
  perWindow: Map<string, Set<string>>,
  windowId: string,
  requestId: string,
  controller: AbortController,
) {
  const key = resourceRequestKey(windowId, requestId);
  inFlight.set(key, controller);
  if (!perWindow.has(windowId)) perWindow.set(windowId, new Set());
  perWindow.get(windowId)!.add(key);
}

function untrackResourceRequest(
  inFlight: Map<string, AbortController>,
  perWindow: Map<string, Set<string>>,
  windowId: string,
  requestId: string,
) {
  const key = resourceRequestKey(windowId, requestId);
  inFlight.delete(key);
  perWindow.get(windowId)?.delete(key);
}

// Fetches a single resource for one napplet window, enforcing the origin allowlist, the
// response-size cap, and abort tracking. Split out of createResourceService's factory so the
// factory itself stays a thin wire-up (D-12); behaviour is unchanged from the pre-split version.
async function fetchResource(
  windowId: string,
  requestId: string,
  url: string,
  init: any,
  send: (message: any) => void,
  options: ResourceServiceOptions,
  inFlight: Map<string, AbortController>,
  perWindow: Map<string, Set<string>>,
) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    sendResourceError(send, requestId, "invalid-url", `invalid URL: ${url}`);
    return;
  }

  const identity = getWindowIdentity(windowId);
  if (!identity) {
    sendResourceError(send, requestId, "denied", "napplet identity not resolvable");
    return;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    sendResourceError(send, requestId, "denied", `scheme ${parsed.protocol} is not allowed`);
    return;
  }
  if (!isResourceRequestAllowed(identity, parsed.origin, options)) {
    sendResourceError(
      send,
      requestId,
      "denied",
      `origin ${parsed.origin} is not allowed: resource:fetch was not approved for this napplet`,
    );
    return;
  }

  const controller = new AbortController();
  trackResourceRequest(inFlight, perWindow, windowId, requestId, controller);
  try {
    const response = await fetch(url, {
      method: init?.method,
      headers: init?.headers ? { ...init.headers } : undefined,
      signal: controller.signal,
    });
    const contentLength = getContentLength(response.headers);
    if (contentLength !== undefined && contentLength > MAX_RESOURCE_BYTES) {
      sendResourceError(send, requestId, "response-too-large", `resource exceeds ${MAX_RESOURCE_BYTES} bytes`);
      return;
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_RESOURCE_BYTES) {
      sendResourceError(send, requestId, "response-too-large", `resource exceeds ${MAX_RESOURCE_BYTES} bytes`);
      return;
    }
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => (headers[key] = value));
    const mime = response.headers.get("content-type") || "application/octet-stream";
    send({
      type: "resource.bytes.result",
      id: requestId,
      requestId,
      blob: new Blob([buffer], { type: mime }),
      mime,
      status: response.status,
      headers,
      bodyBase64: arrayBufferToBase64(buffer),
    });
  } catch (e) {
    const aborted = controller.signal.aborted || (e instanceof Error && e.name === "AbortError");
    sendResourceError(
      send,
      requestId,
      aborted ? "canceled" : "network-error",
      e instanceof Error ? e.message : String(e),
    );
  } finally {
    untrackResourceRequest(inFlight, perWindow, windowId, requestId);
  }
}

// Parses an incoming shell message and dispatches it to the (possibly bounded-concurrency)
// resource fetch. Split out of createResourceService's factory (D-12); behaviour, including the
// per-request/per-batch limits, is unchanged from the pre-split version.
function handleResourceMessage(
  windowId: string,
  message: any,
  send: (message: any) => void,
  options: ResourceServiceOptions,
  inFlight: Map<string, AbortController>,
  perWindow: Map<string, Set<string>>,
) {
  switch (message.type) {
    case "resource.info": {
      const id = requestIdFromMessage(message);
      if (id) send({ type: "resource.info.result", id, info: { schemes: [{ scheme: "https", enabled: true }] } });
      return;
    }
    case "resource.bytes": {
      const id = requestIdFromMessage(message);
      if (id && typeof message.url === "string")
        fetchResource(windowId, id, message.url, message.init, send, options, inFlight, perWindow);
      return;
    }
    case "resource.bytesMany": {
      const id = requestIdFromMessage(message);
      if (!id || !Array.isArray(message.urls)) return;
      if (message.urls.length > MAX_RESOURCE_URLS) {
        sendResourceError(send, id, "too-many-urls", `resource.bytesMany accepts at most ${MAX_RESOURCE_URLS} URLs`);
        return;
      }

      mapWithConcurrency(
        message.urls.filter((url: unknown): url is string => typeof url === "string"),
        MAX_CONCURRENT_RESOURCE_FETCHES,
        async (url: string) => {
          const itemId = `${id}:${url}`;
          let result: any;
          await fetchResource(
            windowId,
            itemId,
            url,
            message.init,
            (response) => (result = response),
            options,
            inFlight,
            perWindow,
          );
          if (result?.type === "resource.bytes.result")
            return { url, ok: true, blob: result.blob, mime: result.mime };
          return {
            url,
            ok: false,
            error: result?.error ?? "network-error",
            code: result?.code,
            message: result?.message,
          };
        },
      ).then((items) => send({ type: "resource.bytesMany.result", id, requestId: id, items }));
      return;
    }
    case "resource.cancel": {
      const id = requestIdFromMessage(message);
      if (id) inFlight.get(resourceRequestKey(windowId, id))?.abort();
      return;
    }
  }
}

export function createResourceService(options: ResourceServiceOptions) {
  const inFlight = new Map<string, AbortController>();
  const perWindow = new Map<string, Set<string>>();

  return {
    descriptor: {
      name: "resource",
      version: "1.0.0",
      description: "NAP-RESOURCE fetch gated on approved resource:fetch or a user Blossom origin",
    },
    handleMessage(windowId: string, message: any, send: (message: any) => void) {
      handleResourceMessage(windowId, message, send, options, inFlight, perWindow);
    },
    onWindowDestroyed(windowId: string) {
      for (const key of perWindow.get(windowId) ?? []) inFlight.get(key)?.abort();
      perWindow.delete(windowId);
    },
  };
}
