import { BehaviorSubject, firstValueFrom } from "rxjs";
import { describe, expect, it, vi } from "vitest";

vi.mock("../accounts", () => ({ default: { active$: new BehaviorSubject(undefined) } }));
vi.mock("../pool", () => ({ default: {} }));
vi.mock("../event-store", () => ({ eventStore: {} }));
vi.mock("../../helpers/nostr/handler-preferences", () => ({
  assertNappletEventKind: (kind: number) => {
    if (kind === 30078) throw new Error("Protected kind");
  },
  assertNappletDecryption: (pubkey: string, account: string) => {
    if (pubkey === account) throw new Error("Protected decryption");
  },
}));

import accounts from "../accounts";
import { kehtoContext, restrictNappletSigner } from "./context";

function signer() {
  return {
    getPublicKey: vi.fn(async () => "account"),
    signEvent: vi.fn(),
    nip44: { encrypt: vi.fn(), decrypt: vi.fn(async () => "plaintext") },
  };
}

describe("Kehto context policy", () => {
  it("disables automatic read decryption and follows account changes", async () => {
    expect(kehtoContext.decrypt).toBe(false);
    const source = accounts.active$ as unknown as BehaviorSubject<ReturnType<typeof signer> | undefined>;
    const current = signer();
    source.next(current);
    const wrapped = await firstValueFrom(kehtoContext.signer as import("rxjs").Observable<ReturnType<typeof signer>>);
    expect(await wrapped.getPublicKey()).toBe("account");
    source.next(undefined);
    expect(await firstValueFrom(kehtoContext.signer as import("rxjs").Observable<unknown>)).toBeUndefined();
  });

  it("checks protected writes before invoking the account signer", () => {
    const account = signer();
    const wrapped = restrictNappletSigner(account);
    expect(() => wrapped.signEvent({ kind: 30078, tags: [], content: "", created_at: 1 })).toThrow("Protected kind");
    expect(account.signEvent).not.toHaveBeenCalled();
    const note = { kind: 1, tags: [], content: "note", created_at: 1 };
    wrapped.signEvent(note);
    expect(account.signEvent).toHaveBeenCalledWith(note);
  });

  it("checks decryption against the captured account, while permitting other peers", async () => {
    const account = signer();
    const wrapped = restrictNappletSigner(account);
    await expect(wrapped.nip44!.decrypt("account", "ciphertext")).rejects.toThrow("Protected decryption");
    expect(account.nip44.decrypt).not.toHaveBeenCalled();
    await expect(wrapped.nip44!.decrypt("peer", "ciphertext")).resolves.toBe("plaintext");
  });
});
