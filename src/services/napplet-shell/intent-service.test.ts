import { NAPPLET_KIND_NAMED } from "@kehto/nip";
import type { IntentRequest } from "@kehto/services";
import { finalizeEvent } from "nostr-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";

let installed: typeof import("../installed-napplets");
let intentService: typeof import("./intent-service");
let targets: typeof import("../napplet-intent-targets");

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
const catalogId = (d: string) => `nip5d:${NAPPLET_KIND_NAMED}:${viewer.pubkey}:${d}`;

function setup(chooseHandler = vi.fn(async (): Promise<string | undefined> => undefined)) {
  const { resolver } = intentService.createNappletIntentService({ chooseHandler, resolveSender: () => undefined });
  return { resolver, chooseHandler };
}

beforeEach(async () => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, value: string) => store.set(k, value),
  });
  vi.stubGlobal("window", { addEventListener: () => {}, setTimeout, clearTimeout });
  vi.resetModules();

  installed = await import("../installed-napplets");
  intentService = await import("./intent-service");
  targets = await import("../napplet-intent-targets");
  targets.setIntentTargetOpener(() => true);
});

describe("napplet intent resolver", () => {
  it("rejects intents no installed napplet advertises", async () => {
    const { resolver, chooseHandler } = setup();
    installed.installNapplet(viewer);

    expect(await resolver.invoke({ ...open, archetype: "chat", convention: "napplet:chat/open" }, context)).toEqual({
      ok: false,
      error: "no handler",
    });
    expect(await resolver.invoke({ ...open, action: "edit", convention: "napplet:profile/edit" }, context)).toEqual({
      ok: false,
      error: "unsupported action",
    });
    expect(chooseHandler).not.toHaveBeenCalled();
  });

  it("dispatches to the only compatible handler without asking", async () => {
    const { resolver, chooseHandler } = setup();
    installed.installNapplet(viewer);
    installed.installNapplet(editor);

    const result = await resolver.invoke({ ...open, action: "edit", convention: "napplet:profile/edit" }, context);
    expect(result).toMatchObject({ ok: true, handler: catalogId("editor") });
    expect(chooseHandler).not.toHaveBeenCalled();
  });

  it("asks the user when several handlers match and none is the default", async () => {
    const { resolver, chooseHandler } = setup();
    installed.installNapplet(viewer);
    installed.installNapplet(editor);

    expect(await resolver.invoke(open, context)).toEqual({ ok: false, error: "user cancelled" });
    expect(chooseHandler).toHaveBeenCalledWith(
      "profile",
      expect.arrayContaining([expect.objectContaining({ id: catalogId("viewer") })]),
    );
  });

  it("uses the user's default for the archetype, unless the napplet asks to choose", async () => {
    const { resolver, chooseHandler } = setup();
    installed.installNapplet(viewer);
    const editorInstall = installed.installNapplet(editor);
    installed.setDefaultIntentHandler("profile", editorInstall!.address);

    expect(await resolver.invoke(open, context)).toMatchObject({ ok: true, handler: catalogId("editor") });
    expect(chooseHandler).not.toHaveBeenCalled();

    await resolver.invoke({ ...open, handler: "choose" }, context);
    expect(chooseHandler).toHaveBeenCalledTimes(1);
  });

  it("only lets a napplet address a specific handler the user confirms", async () => {
    const { resolver, chooseHandler } = setup();
    installed.installNapplet(viewer);
    installed.installNapplet(editor);

    expect(await resolver.invoke({ ...open, handler: catalogId("viewer") }, context)).toEqual({
      ok: false,
      error: "invoke rejected",
    });

    chooseHandler.mockResolvedValueOnce(catalogId("viewer"));
    expect(await resolver.invoke({ ...open, handler: catalogId("viewer") }, context)).toMatchObject({
      ok: true,
      handler: catalogId("viewer"),
    });
  });

  it("reports contracts with their advertised params", async () => {
    const { resolver } = setup();
    installed.installNapplet(viewer);

    const availability = await resolver.available("profile");
    expect(availability.candidates).toEqual([
      expect.objectContaining({
        id: catalogId("viewer"),
        contracts: [{ convention: "napplet:profile/open", params: ["pubkey"] }],
      }),
    ]);
  });
});
