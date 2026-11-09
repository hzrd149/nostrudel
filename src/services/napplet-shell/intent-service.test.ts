import { NAPPLET_KIND_NAMED } from "@kehto/nip";
import type { IntentRequest } from "@kehto/services";
import { finalizeEvent } from "nostr-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";

let state: typeof import("../handler-preference-state");
let handlers: typeof import("../napplet-handlers");
let intentService: typeof import("./intent-service");
const accept = vi.hoisted(() => vi.fn(() => ({ completion: Promise.resolve() })));
vi.mock("../napplet-intent-targets", () => ({ acceptIntent: accept }));
const key = new Uint8Array(32).fill(2);
const context = { sender: "nip5d:35129:source:feed" };
const open: IntentRequest = { archetype: "profile", action: "open", convention: "napplet:profile/open" };
function manifest(d: string, tags: string[][]) {
  return finalizeEvent(
    { kind: NAPPLET_KIND_NAMED, created_at: 1, tags: [["d", d], ["x", "0".repeat(64)], ...tags], content: d },
    key,
  );
}
const viewer = manifest("viewer", [
  ["z", "profile"],
  ["i", "napplet:profile/open", "pubkey"],
]);
const editor = manifest("editor", [
  ["z", "profile"],
  ["i", "napplet:profile/open"],
  ["i", "napplet:profile/edit"],
]);
const reference = (event = viewer) => `35129:${event.pubkey}:${event.tags[0][1]}`;
const catalogId = (event = viewer) => `nip5d:${reference(event)}`;
function setup(chooseHandler = vi.fn(async (): Promise<string | undefined> => undefined)) {
  return {
    ...intentService.createNappletIntentService({ chooseHandler, resolveSender: () => undefined }),
    chooseHandler,
  };
}
function prefer(tags: string[][], privateTags: string[][] = []) {
  state.handlerPreferences$.next(
    new Map([
      [
        "profile",
        {
          event: finalizeEvent({ kind: 31129, created_at: 1, tags: [["d", "profile"], ...tags], content: "" }, key),
          privateTags,
          locked: false,
        },
      ],
    ]),
  );
}
beforeEach(async () => {
  vi.resetModules();
  accept.mockClear();
  vi.stubGlobal("localStorage", { getItem: () => null });
  vi.stubGlobal("window", { addEventListener: () => {} });
  state = await import("../handler-preference-state");
  handlers = await import("../napplet-handlers");
  intentService = await import("./intent-service");
});

describe("preference-based napplet intents", () => {
  it("opens discovery even when the catalog is empty, and preserves the payload", async () => {
    const { resolver } = setup(
      vi.fn(async () => {
        handlers.rememberHandlerManifest(viewer);
        return catalogId();
      }),
    );
    const request = { ...open, payload: { pubkey: "abc" } };
    expect(await resolver.invoke(request, context)).toMatchObject({ ok: true, handler: catalogId() });
    expect(accept).toHaveBeenCalledWith(
      expect.objectContaining({ ...request, sender: context.sender, handler: catalogId() }),
    );
  });
  it("does not auto-select the only discovered handler without a preference", async () => {
    handlers.rememberHandlerManifest(viewer);
    const { resolver, chooseHandler } = setup();
    expect(await resolver.invoke(open, context)).toEqual({ ok: false, error: "user cancelled" });
    expect(chooseHandler).toHaveBeenCalledWith(open, [expect.objectContaining({ id: catalogId() })]);
    expect(accept).not.toHaveBeenCalled();
  });
  it("launches a synced preference without an installation record", async () => {
    handlers.rememberHandlerManifest(viewer);
    prefer([["a", reference()]]);
    const { resolver, chooseHandler } = setup();
    expect(await resolver.invoke(open, context)).toMatchObject({ ok: true, handler: catalogId() });
    expect(chooseHandler).not.toHaveBeenCalled();
  });
  it("uses a device preference and still honors an explicit chooser request", async () => {
    handlers.rememberHandlerManifest(viewer);
    state.localHandlerPreferences$.next({ [open.convention]: reference() });
    const { resolver, chooseHandler } = setup();
    expect(await resolver.invoke(open, context)).toMatchObject({ ok: true });
    await resolver.invoke({ ...open, handler: "choose" }, context);
    expect(chooseHandler).toHaveBeenCalledTimes(1);
  });
  it("falls back to discovery when a preferred manifest is unavailable or incompatible", async () => {
    prefer([["a", reference()]]);
    const { resolver, chooseHandler } = setup();
    await resolver.invoke(open, context);
    handlers.rememberHandlerManifest(viewer);
    await resolver.invoke({ ...open, action: "edit", convention: "napplet:profile/edit" }, context);
    expect(chooseHandler).toHaveBeenCalledTimes(2);
  });
  it("does not bypass choice using a handler hint", async () => {
    handlers.rememberHandlerManifest(viewer);
    const { resolver, chooseHandler } = setup();
    await resolver.invoke({ ...open, handlerHint: { address: reference() } }, context);
    expect(chooseHandler).toHaveBeenCalledTimes(1);
    expect(accept).not.toHaveBeenCalled();
  });
  it("rejects a selected handler incompatible with the exact convention", async () => {
    handlers.rememberHandlerManifest(viewer);
    const { resolver } = setup(vi.fn(async () => catalogId()));
    expect(await resolver.invoke({ ...open, action: "edit", convention: "napplet:profile/edit" }, context)).toEqual({
      ok: false,
      error: "invoke rejected",
    });
    expect(accept).not.toHaveBeenCalled();
  });
  it("requires confirmation for a non-preferred explicit target", async () => {
    handlers.rememberHandlerManifest(viewer);
    handlers.rememberHandlerManifest(editor);
    prefer([["a", reference(editor)]]);
    const { resolver, chooseHandler } = setup();
    await resolver.invoke({ ...open, handler: catalogId() }, context);
    expect(chooseHandler).toHaveBeenCalledTimes(1);
    expect(accept).not.toHaveBeenCalled();
  });
  it("uses exact scope before archetype scope and excludes blocked handlers", async () => {
    handlers.rememberHandlerManifest(viewer);
    handlers.rememberHandlerManifest(editor);
    prefer([
      ["a", reference()],
      ["i", open.convention, reference(editor)],
    ]);
    const { resolver, chooseHandler } = setup();
    expect(await resolver.invoke(open, context)).toMatchObject({ handler: catalogId(editor) });
    const policy = intentService.createNappletIntentService({
      chooseHandler,
      resolveSender: () => undefined,
      isHandlerAllowed: (event) => event.id !== editor.id,
    });
    expect(await policy.resolver.invoke(open, context)).toMatchObject({ handler: catalogId() });
    state.handlerManifests$.next(new Map());
    await resolver.invoke(open, context);
    expect(chooseHandler).toHaveBeenCalledTimes(1);
  });
  it("does not rank private entries above public entries", async () => {
    handlers.rememberHandlerManifest(viewer);
    handlers.rememberHandlerManifest(editor);
    prefer([["a", reference()]], [["a", reference(editor)]]);
    const { resolver, chooseHandler } = setup();
    await resolver.invoke(open, context);
    expect(chooseHandler).toHaveBeenCalledWith(
      open,
      expect.arrayContaining([
        expect.objectContaining({ id: catalogId() }),
        expect.objectContaining({ id: catalogId(editor) }),
      ]),
    );
  });
  it("rejects malformed requests before opening discovery", async () => {
    const { resolver, chooseHandler } = setup();
    expect(await resolver.invoke({ ...open, convention: "napplet:profile/open?pubkey=abc" }, context)).toEqual({
      ok: false,
      error: "invalid convention",
    });
    expect(chooseHandler).not.toHaveBeenCalled();
  });
  it("reports advertised contract parameters", async () => {
    handlers.rememberHandlerManifest(viewer);
    const { resolver } = setup();
    expect((await resolver.available("profile")).candidates).toEqual([
      expect.objectContaining({ contracts: [{ convention: open.convention, params: ["pubkey"] }] }),
    ]);
  });
});
