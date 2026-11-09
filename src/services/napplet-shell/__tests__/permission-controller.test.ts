import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ShellBridge } from "@kehto/shell";
import { createPermissionController, type PermissionAnswer } from "../permission-controller";
import {
  getPermissionDecision,
  getSessionCapabilities,
  grantCapabilities,
  hasApprovedCapability,
  revokeCapabilities,
  setPermissionDecision,
  synchronizePermissionStorage,
  type NappletIdentity,
} from "../permissions";

const identity: NappletIdentity = { pubkey: "publisher", dTag: "app", aggregateHash: "version" };
const controllers: ReturnType<typeof createPermissionController>[] = [];
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
  revokeCapabilities(identity);
});
afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function fixture(ask = vi.fn(async (): Promise<PermissionAnswer> => "session")) {
  const bridge = { runtime: { aclState: { grant: vi.fn(), revoke: vi.fn() } } } as unknown as ShellBridge;
  const controller = createPermissionController({
    identity: (windowId) => (windowId === "frame" ? identity : undefined),
    ask,
    grant: (identity, permission) =>
      grantCapabilities(bridge, identity, [...new Set([...getSessionCapabilities(identity), permission])]),
  });
  controllers.push(controller);
  controller.register("frame");
  return { controller, ask, bridge };
}
describe("runtime permission controller", () => {
  it("asks only for the requested action and reuses a session grant without granting other permissions", async () => {
    const f = fixture();
    expect(await f.controller.authorize("frame", "relay:write")).toBe(true);
    expect(await f.controller.authorize("frame", "relay:write")).toBe(true);
    expect(f.ask).toHaveBeenCalledOnce();
    expect(hasApprovedCapability(identity, "outbox:write")).toBe(false);
    expect(f.bridge.runtime.aclState.revoke).toHaveBeenCalledWith(
      identity.pubkey,
      identity.dTag,
      identity.aggregateHash,
      "outbox:write",
    );
  });
  it("coalesces simultaneous requests for the same frame and permission", async () => {
    let resolve: (answer: PermissionAnswer) => void = () => {};
    const f = fixture(
      vi.fn(
        () =>
          new Promise<PermissionAnswer>((done) => {
            resolve = done;
          }),
      ),
    );
    const first = f.controller.authorize("frame", "cvm:call");
    const second = f.controller.authorize("frame", "cvm:call");
    await vi.waitFor(() => expect(f.ask).toHaveBeenCalledOnce());
    resolve("remember");
    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(getPermissionDecision(identity, "cvm:call")).toBe("allow");
    expect(getPermissionDecision({ ...identity, aggregateHash: "update" }, "cvm:call")).toBe("ask");
  });
  it("blocks without prompting and prompts again after resetting to Ask", async () => {
    setPermissionDecision(identity, "webrtc:connect", "block");
    const f = fixture();
    expect(await f.controller.authorize("frame", "webrtc:connect")).toBe(false);
    expect(f.ask).not.toHaveBeenCalled();
    setPermissionDecision(identity, "webrtc:connect", "ask");
    expect(await f.controller.authorize("frame", "webrtc:connect")).toBe(true);
    expect(f.ask).toHaveBeenCalledOnce();
    setPermissionDecision(identity, "webrtc:connect", "block");
    expect(await f.controller.authorize("frame", "webrtc:connect")).toBe(false);
  });
  it("cannot restore a permission revoked while its prompt was pending", async () => {
    let resolve: (answer: PermissionAnswer) => void = () => {};
    const f = fixture(
      vi.fn(
        () =>
          new Promise<PermissionAnswer>((done) => {
            resolve = done;
          }),
      ),
    );
    const pending = f.controller.authorize("frame", "resource:https");
    await vi.waitFor(() => expect(f.ask).toHaveBeenCalledOnce());
    setPermissionDecision(identity, "resource:https", "block");
    expect(await pending).toBe(false);
    resolve("remember");
    await Promise.resolve();
    expect(getPermissionDecision(identity, "resource:https")).toBe("block");
    expect(hasApprovedCapability(identity, "resource:https")).toBe(false);
  });
  it("cancels on frame destruction and suppresses late approval", async () => {
    let resolve: (answer: PermissionAnswer) => void = () => {};
    const f = fixture(
      vi.fn(
        () =>
          new Promise<PermissionAnswer>((done) => {
            resolve = done;
          }),
      ),
    );
    const pending = f.controller.authorize("frame", "outbox:write");
    await vi.waitFor(() => expect(f.ask).toHaveBeenCalledOnce());
    f.controller.destroyWindow("frame");
    expect(await pending).toBe(false);
    resolve("session");
    await Promise.resolve();
    expect(hasApprovedCapability(identity, "outbox:write")).toBe(false);
  });
  it("cancels a consent request at the operation deadline", async () => {
    const f = fixture(vi.fn(() => new Promise<PermissionAnswer>(() => {})));
    const controller = new AbortController();
    const pending = f.controller.authorize("frame", "cvm:call", controller.signal);
    controller.abort();
    expect(await pending).toBe(false);
    expect(hasApprovedCapability(identity, "cvm:call")).toBe(false);
  });
  it("invalidates session grants and pending consent on cross-tab storage changes", async () => {
    const f = fixture();
    await f.controller.authorize("frame", "relay:write");
    synchronizePermissionStorage({ key: "nostrudel:napplet:always-allow" } as StorageEvent);
    expect(hasApprovedCapability(identity, "outbox:write")).toBe(false);
    await f.controller.authorize("frame", "relay:write");
    expect(f.ask).toHaveBeenCalledTimes(2);
  });
  it("prompts for public reads and prompts again after resetting a session grant", async () => {
    const f = fixture();
    for (const permission of ["relay:read", "outbox:read", "resource:nostr"] as const)
      expect(await f.controller.authorize("frame", permission)).toBe(true);
    expect(f.ask).toHaveBeenCalledTimes(3);
    setPermissionDecision(identity, "relay:read", "ask");
    expect(await f.controller.authorize("frame", "relay:read")).toBe(true);
    expect(f.ask).toHaveBeenCalledTimes(4);
    setPermissionDecision(identity, "outbox:read", "block");
    expect(await f.controller.authorize("frame", "outbox:read")).toBe(false);
  });
  it("remembers an explicit rejection until reset, while dismissal leaves Ask", async () => {
    const f = fixture(vi.fn(async (): Promise<PermissionAnswer> => "reject"));
    expect(await f.controller.authorize("frame", "relay:read")).toBe(false);
    expect(getPermissionDecision(identity, "relay:read")).toBe("block");
    expect(await f.controller.authorize("frame", "relay:read")).toBe(false);
    expect(f.ask).toHaveBeenCalledOnce();
    setPermissionDecision(identity, "relay:read", "ask");
    f.ask.mockResolvedValue("deny");
    expect(await f.controller.authorize("frame", "relay:read")).toBe(false);
    expect(getPermissionDecision(identity, "relay:read")).toBe("ask");
    expect(f.ask).toHaveBeenCalledTimes(2);
  });
});
