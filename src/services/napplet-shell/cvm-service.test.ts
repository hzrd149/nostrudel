import { afterEach, describe, expect, it, vi } from "vitest";
import { finalizeEvent, generateSecretKey, getPublicKey, nip44, type NostrEvent } from "nostr-tools";
import { createNappletCvmService } from "./cvm-service";
import type { CvmRelayTransport } from "./cvm-relay-transport";

vi.mock("localforage", () => ({
  default: {
    createInstance: () => {
      const storage = new Map();
      return {
        getItem: async (key: string) => storage.get(key) ?? null,
        setItem: async (key: string, value: string) => storage.set(key, value),
      };
    },
  },
}));
vi.mock("../pool", () => {
  throw new Error("CVM must never use the account pool");
});
vi.mock("../accounts", () => {
  throw new Error("CVM must never access the active account");
});

const serverKey = generateSecretKey();
const server = { pubkey: getPublicKey(serverKey), relays: ["wss://relay.example"] };
const services: ReturnType<typeof createNappletCvmService>[] = [];
afterEach(() => {
  for (const service of services.splice(0)) for (const id of ["a", "b"]) service.onWindowDestroyed?.(id);
  vi.useRealTimers();
});
function fixture(consent = vi.fn(async () => true), respond = true) {
  const transports: CvmRelayTransport[] = [];
  const requests: any[] = [];
  const incoming: ((message: any, key?: Uint8Array) => void)[] = [];
  const service = createNappletCvmService({
    resolveIdentity: (id) => (id === "missing" ? undefined : `app:${id}`),
    requestConsent: consent,
    createTransport: () => {
      let receive: ((event: NostrEvent) => void) | undefined;
      const transport: CvmRelayTransport = {
        subscribe: vi.fn((_relays, _filter, callbacks) => {
          receive = callbacks.liveEventCallback;
          return vi.fn();
        }),
        publish: vi.fn(async (wrap) => {
          const inner = JSON.parse(
            nip44.v2.decrypt(wrap.content, nip44.v2.utils.getConversationKey(serverKey, wrap.pubkey)),
          );
          const request = JSON.parse(inner.content);
          requests.push({ ...request, pubkey: inner.pubkey });
          if (respond && request.id !== undefined) {
            const message = {
              jsonrpc: "2.0",
              id: request.id,
              result:
                request.method === "initialize"
                  ? { protocolVersion: "2025-11-25", capabilities: {} }
                  : { tools: [{ name: "echo" }] },
            };
            const response = finalizeEvent(
              {
                kind: 25910,
                created_at: Math.floor(Date.now() / 1000),
                tags: [["p", inner.pubkey]],
                content: JSON.stringify(message),
              },
              serverKey,
            );
            const key = generateSecretKey();
            receive?.(
              finalizeEvent(
                {
                  kind: 21059,
                  created_at: response.created_at,
                  tags: [["p", inner.pubkey]],
                  content: nip44.v2.encrypt(
                    JSON.stringify(response),
                    nip44.v2.utils.getConversationKey(key, inner.pubkey),
                  ),
                },
                key,
              ),
            );
          }
          return true;
        }),
        close: vi.fn(),
      };
      incoming.push((message, signingKey = serverKey) => {
        const recipient = requests.at(-1).pubkey;
        const inner = finalizeEvent(
          {
            kind: 25910,
            created_at: Math.floor(Date.now() / 1000),
            tags: [["p", recipient]],
            content: JSON.stringify(message),
          },
          signingKey,
        );
        const key = generateSecretKey();
        receive?.(
          finalizeEvent(
            {
              kind: 21059,
              created_at: inner.created_at,
              tags: [["p", recipient]],
              content: nip44.v2.encrypt(JSON.stringify(inner), nip44.v2.utils.getConversationKey(key, recipient)),
            },
            key,
          ),
        );
      });
      transports.push(transport);
      return transport;
    },
  });
  services.push(service);
  const invoke = (windowId: string, payload: Record<string, unknown>) =>
    new Promise<any>((resolve) =>
      service.handleMessage(
        windowId,
        {
          type: "cvm.request",
          id: crypto.randomUUID(),
          server,
          message: { jsonrpc: "2.0", id: "same", method: "tools/list" },
          ...payload,
        } as never,
        resolve,
      ),
    );
  return { service, invoke, consent, requests, transports, incoming };
}
describe("NAP-CVM", () => {
  it("uses encrypted local identities and rechecks permission before publication", async () => {
    const f = fixture();
    const first = await f.invoke("a", {});
    expect(first.message.result.tools).toEqual([{ name: "echo" }]);
    await f.invoke("a", { message: { jsonrpc: "2.0", id: "next", method: "tools/list" } });
    expect(f.consent.mock.calls.length).toBeGreaterThan(1);
    const checks = f.consent.mock.calls.length;
    await f.invoke("b", {});
    expect(f.consent.mock.calls.length).toBeGreaterThan(checks);
    const initialized = f.requests.filter((r) => r.method === "initialize");
    expect(initialized).toHaveLength(2);
    expect(initialized[0].pubkey).not.toBe(initialized[1].pubkey);
    expect(f.requests.find((r) => r.method === "tools/list").id).not.toBe("same");
  });
  it("refusal and invalid requests never publish", async () => {
    const f = fixture(vi.fn(async () => false));
    expect((await f.invoke("a", {})).error).toBe("policy denied");
    expect(f.transports[0].publish).not.toHaveBeenCalled();
    const count = f.consent.mock.calls.length;
    expect((await f.invoke("a", { server: { pubkey: "invalid" } })).error).toBe("invalid request");
    expect(f.consent).toHaveBeenCalledTimes(count);
  });
  it("notifications complete without waiting for an MCP response", async () => {
    const f = fixture();
    await f.invoke("a", {});
    expect(
      (
        await f.invoke("a", {
          message: { jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: "unknown" } },
        })
      ).error,
    ).toBe("invalid message");
    expect((await f.invoke("a", { message: { jsonrpc: "2.0", method: "ping" } })).message).toBeNull();
  });
  it("times out consent and prevents late publication", async () => {
    vi.useFakeTimers();
    let approve: (allowed: boolean) => void = () => {};
    const f = fixture(
      vi.fn(
        () =>
          new Promise<boolean>((resolve) => {
            approve = resolve;
          }),
      ),
    );
    const result = f.invoke("a", { options: { timeoutMs: 10 } });
    await vi.advanceTimersByTimeAsync(11);
    expect((await result).error).toBe("relay timeout");
    approve(true);
    await Promise.resolve();
    expect(f.transports[0].publish).not.toHaveBeenCalled();
  });
  it("closing a frame cancels pending work and closes only its transport", async () => {
    const f = fixture(undefined, false);
    const pending = f.invoke("a", {});
    await vi.waitFor(() => expect(f.transports[0].publish).toHaveBeenCalled());
    f.service.onWindowDestroyed?.("a");
    expect((await pending).error).toBe("session closed");
    expect(f.transports[0].close).toHaveBeenCalledOnce();
    expect((await f.invoke("b", { type: "cvm.registry.has" })).has).toBe(false);
  });
  it("rejects a response from a different signing server and restores the original MCP id", async () => {
    const f = fixture(undefined, false);
    const pending = f.invoke("a", { options: { initialize: false } });
    await vi.waitFor(() => expect(f.requests).toHaveLength(1));
    const response = { jsonrpc: "2.0", id: f.requests[0].id, result: { ok: true } };
    f.incoming[0](response, generateSecretKey());
    await new Promise((resolve) => setTimeout(resolve, 5));
    f.incoming[0](response);
    expect((await pending).message).toEqual({ ...response, id: "same" });
  });
  it.each(["deny", "prompt", "allow"])("fails payment gates without retry for %s", async (payment) => {
    const f = fixture(undefined, false);
    const pending = f.invoke("a", { options: { initialize: false, payment } });
    await vi.waitFor(() => expect(f.requests).toHaveLength(1));
    f.incoming[0]({ jsonrpc: "2.0", id: f.requests[0].id, error: { code: -32042, message: "pay" } });
    expect((await pending).error).toBe(payment === "prompt" ? "payment required" : "payment denied");
    expect(f.transports[0].publish).toHaveBeenCalledOnce();
  });
  it("discovers signed JSON and tag metadata, retaining the newest announcement without inventing relays or pricing", async () => {
    const f = fixture();
    const pending = f.invoke("a", { type: "cvm.discover", query: { limit: 2 } });
    await vi.waitFor(() => expect(f.transports[0].subscribe).toHaveBeenCalled());
    const callbacks = vi.mocked(f.transports[0].subscribe).mock.calls[0][2];
    const event = (created_at: number, content: string, tags: string[][] = []) =>
      finalizeEvent({ kind: 11316, created_at, content, tags }, serverKey);
    const newest = event(2, JSON.stringify({ name: "Soy server" }));
    callbacks.liveEventCallback(newest);
    callbacks.liveEventCallback(event(1, "", [["name", "old"]]));
    callbacks.liveEventCallback(
      JSON.parse(JSON.stringify({ ...event(3, "", [["name", "forged"]]), sig: "0".repeat(128) })),
    );
    callbacks.eoseEventsCallback([]);
    expect((await pending).servers).toEqual([{ pubkey: server.pubkey, name: "Soy server" }]);
    expect(f.transports[0].publish).not.toHaveBeenCalled();
  });
});
