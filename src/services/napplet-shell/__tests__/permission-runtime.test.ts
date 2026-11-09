import { afterEach, expect, it, vi } from "vitest";
import { originRegistry, type ShellBridge } from "@kehto/shell";
import { synchronizeRuntimePermissions } from "../permission-runtime";
import {
  grantCapabilities,
  registerWindowIdentity,
  setPermissionDecision,
  unregisterWindowIdentity,
} from "../permissions";

afterEach(() => {
  originRegistry.clear();
  unregisterWindowIdentity("frame");
  unregisterWindowIdentity("other");
  vi.unstubAllGlobals();
});
it("revokes the affected service immediately while preserving unrelated frames and peer access", () => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
  const identity = { pubkey: "publisher", dTag: "app", aggregateHash: "version" };
  registerWindowIdentity("frame", identity);
  registerWindowIdentity("other", { ...identity, dTag: "other" });
  originRegistry.register({} as Window, "frame", identity);
  originRegistry.register({} as Window, "other", identity);
  const bridge = { runtime: { aclState: { grant: vi.fn(), revoke: vi.fn() } } } as unknown as ShellBridge;
  const cvm = { descriptor: { name: "cvm", version: "1" }, handleMessage: vi.fn(), onWindowDestroyed: vi.fn() };
  const webrtc = { descriptor: { name: "webrtc", version: "1" }, handleMessage: vi.fn(), onWindowDestroyed: vi.fn() };
  grantCapabilities(bridge, identity, ["cvm:call", "webrtc:connect"]);
  setPermissionDecision(identity, "cvm:call", "block");
  synchronizeRuntimePermissions(bridge, { cvm, webrtc }, { identity, permission: "cvm:call" });
  expect(cvm.onWindowDestroyed).toHaveBeenCalledExactlyOnceWith("frame");
  expect(webrtc.onWindowDestroyed).not.toHaveBeenCalled();
  expect(originRegistry.getAllWindowIds()).toContain("frame");
  expect(bridge.runtime.aclState.revoke).toHaveBeenCalledWith(
    identity.pubkey,
    identity.dTag,
    identity.aggregateHash,
    "cvm:call",
  );
});
