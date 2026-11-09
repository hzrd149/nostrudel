import { afterEach, describe, expect, it, vi } from "vitest";
import { originRegistry, type ShellBridge } from "@kehto/shell";
import { createPermissionGate, messagePermission } from "./permission-gate";

afterEach(() => {
  originRegistry.clear();
  vi.useRealTimers();
});
function fixture(authorize = vi.fn(async () => true)) {
  const source = { postMessage: vi.fn() } as unknown as Window;
  originRegistry.register(source, "frame", { dTag: "app", aggregateHash: "version" });
  originRegistry.bindPort("frame", { postMessage: source.postMessage, close: vi.fn() } as unknown as MessagePort);
  const handleMessage = vi.fn();
  const bridge = { handleMessage, runtime: { handleMessage } } as unknown as ShellBridge;
  const gate = createPermissionGate(bridge, authorize);
  const send = (data: object, sender = source) =>
    gate.filterMessage(
      originRegistry.getWindowId(sender) ?? "unknown",
      data as Parameters<typeof gate.filterMessage>[1],
    );
  return { bridge, source, gate, authorize, send };
}
describe("source-bound runtime permission gate", () => {
  it("maps reads, writes, common signing, identity and peer operations", () => {
    expect(messagePermission({ type: "relay.query" })).toBe("relay:read");
    expect(messagePermission({ type: "outbox.publish" })).toBe("outbox:write");
    expect(messagePermission({ type: "common.react" })).toBe("relay:write");
    expect(messagePermission({ type: "identity.getPublicKey" })).toBe("identity:read");
    expect(messagePermission({ type: "webrtc.open" })).toBe("webrtc:connect");
  });
  it("waits for permission before passing the original envelope to the bridge", async () => {
    let approve: (allowed: boolean) => void = () => {};
    const f = fixture(
      vi.fn(
        () =>
          new Promise<boolean>((resolve) => {
            approve = resolve;
          }),
      ),
    );
    f.send({ type: "cvm.request", id: "request" });
    expect(f.bridge.handleMessage).not.toHaveBeenCalled();
    approve(true);
    await Promise.resolve();
    expect(f.bridge.handleMessage).toHaveBeenCalledOnce();
  });
  it("ignores forged windows and host-owned messages without prompting", () => {
    const f = fixture();
    f.send({ type: "cvm.request", id: "request" }, {} as Window);
    f.send({ type: "cvm.event", message: {} });
    f.send({ type: "identity.getPublicKey.result", id: "fake" });
    expect(f.authorize).not.toHaveBeenCalled();
    expect(f.bridge.handleMessage).not.toHaveBeenCalled();
  });
  it("does not replay an approved request into a replacement registration", async () => {
    let approve: (allowed: boolean) => void = () => {};
    const f = fixture(
      vi.fn(
        () =>
          new Promise<boolean>((resolve) => {
            approve = resolve;
          }),
      ),
    );
    f.send({ type: "outbox.publish", id: "request" });
    originRegistry.unregister("frame");
    // Kehto requires a fresh iframe for each document, even when reusing the runtime window ID.
    const replacement = { postMessage: vi.fn() } as unknown as Window;
    originRegistry.register(replacement, "frame", { dTag: "app", aggregateHash: "other" });
    approve(true);
    await Promise.resolve();
    expect(f.bridge.handleMessage).not.toHaveBeenCalled();
  });
  it("returns correlated denials and closes refused relay subscriptions", async () => {
    const f = fixture(vi.fn(async () => false));
    f.send({ type: "cvm.request", id: "request" });
    f.send({ type: "relay.subscribe", id: "subscribe", subId: "sub" });
    await Promise.resolve();
    expect(f.source.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "cvm.request.result", id: "request", error: "policy denied" }),
    );
    expect(f.source.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "relay.closed", subId: "sub" }));
  });
  it("does not dispatch an approval after the gate is destroyed", async () => {
    let approve: (allowed: boolean) => void = () => {};
    const f = fixture(
      vi.fn(
        () =>
          new Promise<boolean>((resolve) => {
            approve = resolve;
          }),
      ),
    );
    expect(f.send({ type: "theme.get", id: "pending" })).toBe("drop");
    f.gate.destroy();
    approve(true);
    await Promise.resolve();
    expect(f.bridge.handleMessage).not.toHaveBeenCalled();
    expect(f.source.postMessage).not.toHaveBeenCalled();
  });
  it("allows the handshake without granting permissions", () => {
    const f = fixture();
    expect(f.send({ type: "shell.ready" })).toBe("dispatch");
    expect(f.authorize).not.toHaveBeenCalled();
    expect(f.bridge.handleMessage).not.toHaveBeenCalled();
  });
  it("subtracts runtime consent time from the CVM operation deadline", async () => {
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
    f.send({ type: "cvm.request", id: "request", options: { timeoutMs: 30000 } });
    await vi.advanceTimersByTimeAsync(15000);
    approve(true);
    await Promise.resolve();
    expect(f.bridge.handleMessage).toHaveBeenCalledWith(
      "frame",
      expect.objectContaining({ options: { timeoutMs: 15000 } }),
    );
  });
});
