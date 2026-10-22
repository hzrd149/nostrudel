import type { IntentDispatchParams } from "@kehto/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

let targets: typeof import("./napplet-intent-targets");

const params: IntentDispatchParams = {
  handler: "nip5d:35129:target:viewer",
  sender: "nip5d:35129:source:feed",
  archetype: "note",
  action: "open",
  convention: "napplet:note/open",
  payload: { target: { type: "event", id: "abc" } },
  sourceWindowId: "napplet:source",
};

const delivery = {
  type: "intent.deliver",
  delivery: {
    sender: params.sender,
    archetype: params.archetype,
    action: params.action,
    convention: params.convention,
    payload: params.payload,
  },
};

function frame() {
  return { postMessage: vi.fn() } as unknown as Window & { postMessage: ReturnType<typeof vi.fn> };
}

beforeEach(async () => {
  vi.stubGlobal("window", { setTimeout, clearTimeout });
  vi.resetModules();
  targets = await import("./napplet-intent-targets");
});

describe("acceptIntent", () => {
  it("opens the target and delivers the attested intent once it loads", async () => {
    const open = vi.fn(() => true);
    targets.setIntentTargetOpener(open);

    const { completion } = targets.acceptIntent(params);
    expect(open).toHaveBeenCalledWith(params.handler);

    const target = frame();
    targets.attachIntentTarget(params.handler, target);
    await completion;

    expect(target.postMessage).toHaveBeenCalledWith(delivery, "*");
  });

  it("delivers in place to a loaded target, including repeated identical intents", async () => {
    const open = vi.fn(() => true);
    targets.setIntentTargetOpener(open);
    const target = frame();
    targets.attachIntentTarget(params.handler, target);

    await targets.acceptIntent(params).completion;
    await targets.acceptIntent(params).completion;

    expect(open).not.toHaveBeenCalled();
    expect(target.postMessage).toHaveBeenCalledTimes(2);
  });

  it("never delivers to a frame that is not the resolved target", () => {
    targets.setIntentTargetOpener(() => true);
    const other = frame();
    targets.attachIntentTarget("nip5d:35129:other:app", other);

    targets.acceptIntent(params);
    expect(other.postMessage).not.toHaveBeenCalled();
  });

  it("does not replay a delivered intent when the target reloads", async () => {
    targets.setIntentTargetOpener(() => true);
    const first = frame();
    const detach = targets.attachIntentTarget(params.handler, first);
    await targets.acceptIntent(params).completion;

    detach();
    const reloaded = frame();
    targets.attachIntentTarget(params.handler, reloaded);
    expect(reloaded.postMessage).not.toHaveBeenCalled();
  });

  it("refuses the intent when the target cannot be opened", () => {
    targets.setIntentTargetOpener(() => false);
    expect(() => targets.acceptIntent(params)).toThrow();
  });
});
