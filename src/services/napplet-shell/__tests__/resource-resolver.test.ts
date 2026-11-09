import { afterEach, describe, expect, it, vi } from "vitest";
import { finalizeEvent, generateSecretKey, nip19 } from "nostr-tools";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { createResourceResolver } from "../resource-resolver";
import { createResourceService } from "../resource-service";
import type { ResourcePermission } from "../permission-types";

afterEach(() => vi.unstubAllGlobals());
const body = new TextEncoder().encode("verified blob");
const hash = bytesToHex(sha256(body));
function fixture(allowed: ResourcePermission[] = ["resource:https", "resource:nostr", "resource:blossom"]) {
  const authorize = vi.fn(async (_windowId: string, permission: ResourcePermission) => allowed.includes(permission));
  const loadNostr = vi.fn(async () => undefined as ReturnType<typeof finalizeEvent> | undefined);
  const fetch = vi.fn(async () => new Response(body));
  vi.stubGlobal("fetch", fetch);
  const options = { authorize, loadNostr, getBlossomOrigins: () => ["https://blossom.example"] };
  const resolve = createResourceResolver(options);
  const init = { windowId: "frame", signal: new AbortController().signal };
  return { options, resolve, init, authorize, loadNostr, fetch };
}
describe("resource-specific authorization", () => {
  it("requests only HTTPS for ordinary HTTPS resources", async () => {
    const f = fixture(["resource:https"]);
    await f.resolve("https://files.example/file.txt", f.init);
    expect(f.authorize).toHaveBeenCalledExactlyOnceWith("frame", "resource:https", expect.any(AbortSignal));
  });
  it("does not bypass Blossom permission for a configured server", async () => {
    const f = fixture(["resource:https"]);
    await expect(f.resolve(`https://blossom.example/${hash}`, f.init)).rejects.toMatchObject({
      code: "blocked-by-policy",
    });
    expect(f.fetch).not.toHaveBeenCalled();
  });
  it("uses only Blossom permission for verified explicit and hash-path resources", async () => {
    const f = fixture(["resource:blossom"]);
    const first = await f.resolve(`blossom:${hash}.txt`, f.init);
    expect(await first.text()).toBe("verified blob");
    await f.resolve(`https://files.example/${hash}.txt`, f.init);
    expect(f.authorize.mock.calls.map((call) => call[1])).toEqual(["resource:blossom", "resource:blossom"]);
  });
  it("requires HTTPS separately before falling back to an unverified hash-shaped URL", async () => {
    const f = fixture(["resource:blossom"]);
    f.fetch.mockImplementation(async () => new Response("wrong hash"));
    await expect(f.resolve(`https://files.example/${hash}`, f.init)).rejects.toMatchObject({
      code: "blocked-by-policy",
    });
    expect(f.authorize.mock.calls.map((call) => call[1])).toEqual(["resource:blossom", "resource:https"]);
    expect(f.fetch).toHaveBeenCalledTimes(2);
  });
  it("requires only Nostr permission and verifies the returned event reference", async () => {
    const f = fixture(["resource:nostr"]);
    const event = finalizeEvent({ kind: 1, created_at: 1, tags: [], content: "test" }, generateSecretKey());
    f.loadNostr.mockResolvedValue(event);
    const reference = `nostr:${nip19.noteEncode(event.id)}`;
    expect(await (await f.resolve(reference, f.init)).json()).toEqual(JSON.parse(JSON.stringify(event)));
    expect(f.authorize).toHaveBeenCalledExactlyOnceWith("frame", "resource:nostr", expect.any(AbortSignal));
    expect(f.fetch).not.toHaveBeenCalled();
    await expect(f.resolve(`nostr:${nip19.noteEncode("a".repeat(64))}`, f.init)).rejects.toMatchObject({
      code: "not-found",
    });
  });
  it("authorizes mixed batches per item and does not fetch blocked items", async () => {
    const f = fixture(["resource:https"]);
    const service = createResourceService(f.options);
    const sent = vi.fn();
    service.handleMessage(
      "frame",
      {
        type: "resource.bytesMany",
        id: "batch",
        requests: [{ url: "https://files.example/file.txt" }, { url: `blossom:${hash}.txt` }],
      } as never,
      sent,
    );
    await vi.waitFor(() => expect(sent).toHaveBeenCalled());
    expect(sent.mock.calls[0][0]).toMatchObject({
      type: "resource.bytesMany.result",
      id: "batch",
      items: [{ ok: true }, { ok: false, error: "blocked-by-policy" }],
    });
    expect(f.fetch).toHaveBeenCalledOnce();
    service.onWindowDestroyed?.("frame");
  });
  it("discloses resource schemes without prompting or performing network I/O", async () => {
    const f = fixture([]);
    const sent = vi.fn();
    createResourceService(f.options).handleMessage("frame", { type: "resource.info", id: "info" } as never, sent);
    await vi.waitFor(() => expect(sent).toHaveBeenCalled());
    expect(sent.mock.calls[0][0].info.schemes.map((entry: { scheme: string }) => entry.scheme)).toEqual([
      "nostr",
      "https",
      "blossom",
    ]);
    expect(f.authorize).not.toHaveBeenCalled();
    expect(f.fetch).not.toHaveBeenCalled();
  });
  it("aborts an in-flight resource when its frame or permission is revoked", async () => {
    const f = fixture(["resource:https"]);
    let signal: AbortSignal | undefined;
    const fetch = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          signal = init.signal!;
          signal.addEventListener("abort", () => reject(signal!.reason), { once: true });
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const service = createResourceService(f.options);
    const sent = vi.fn();
    service.handleMessage(
      "frame",
      { type: "resource.bytes", id: "pending", url: "https://files.example/file" } as never,
      sent,
    );
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    service.onWindowDestroyed?.("frame");
    expect(signal?.aborted).toBe(true);
    await Promise.resolve();
    expect(sent).not.toHaveBeenCalled();
  });
});
