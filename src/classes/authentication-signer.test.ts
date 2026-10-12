import { Nip07Interface } from "applesauce-signers";
import { finalizeEvent, nip42, NostrEvent } from "nostr-tools";
import { BehaviorSubject } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import AuthenticationSigner from "./authentication-signer";

const url = "wss://auth.example/";
const key = new Uint8Array(32).fill(1);

function signer(signEvent: Nip07Interface["signEvent"]): Nip07Interface {
  return { signEvent, getPublicKey: async () => "pubkey" };
}

describe("account switching during relay authentication", () => {
  it("reuses pending prompts when the pool adds another relay and cancels obsolete challenges", async () => {
    const auth = new AuthenticationSigner(signer(async (draft) => finalizeEvent(draft, key)));
    const template = nip42.makeAuthEvent(url, "first");
    const first = auth.signEvent(template);
    const canceled = first.catch((error) => error.message);
    expect(auth.signEvent(template)).toBe(first);
    const second = auth.signEvent(nip42.makeAuthEvent(url, "second"));
    expect(await canceled).toBe("Canceled");
    await auth.authenticate(url);
    expect((await second).tags).toContainEqual(["challenge", "second"]);
  });

  it("cancels the old prompt and ignores a late signature from the previous account", async () => {
    let resolveSignature!: (event: NostrEvent) => void;
    const sign = vi.fn(() => new Promise<NostrEvent>((resolve) => (resolveSignature = resolve)));
    const active = new BehaviorSubject<Nip07Interface | undefined>(signer(sign));
    const auth = new AuthenticationSigner(active);
    const template = nip42.makeAuthEvent(url, "challenge");
    const request = auth.signEvent(template);
    const requestResult = request.catch((error) => error.message);
    const signing = auth.authenticate(url);
    const signingResult = signing?.catch((error) => error.message);

    active.next(signer(async (draft) => finalizeEvent(draft, key)));
    expect(await requestResult).toBe("Canceled");
    expect(await signingResult).toBe("Canceled");
    const nextRequest = auth.signEvent(template);
    resolveSignature(finalizeEvent(template, key));
    await Promise.resolve();
    expect(auth.getRelayState(url)?.status).toBe("requested");
    await auth.authenticate(url);
    expect((await nextRequest).pubkey).toBe(finalizeEvent(template, key).pubkey);
  });

  it("returns the signing promise so manual UI actions wait for signing failures", async () => {
    const auth = new AuthenticationSigner(
      signer(async () => {
        throw new Error("Signer rejected");
      }),
    );
    const request = auth.signEvent(nip42.makeAuthEvent(url, "challenge"));
    const rejected = expect(request).rejects.toThrow("Signer rejected");
    await expect(auth.authenticate(url)).rejects.toThrow("Signer rejected");
    await rejected;
    expect(auth.getRelayState(url)?.status).toBe("rejected");
  });

  it("keeps never-authenticate privacy mode without calling the signer", async () => {
    const sign = vi.fn(async (draft) => finalizeEvent(draft, key));
    const auth = new AuthenticationSigner(signer(sign));
    auth.defaultMode = "never";
    await expect(auth.signEvent(nip42.makeAuthEvent(url, "challenge"))).rejects.toThrow("Authentication rejected");
    expect(sign).not.toHaveBeenCalled();
  });
});

describe("authenticate without a pending request", () => {
  it("returns undefined and never calls the signer when the relay never asked to authenticate", () => {
    const sign = vi.fn(async (draft) => finalizeEvent(draft, key));
    const auth = new AuthenticationSigner(signer(sign));
    expect(auth.authenticate(url)).toBeUndefined();
    expect(sign).not.toHaveBeenCalled();
  });

  it("returns undefined after the request was already signed", async () => {
    const sign = vi.fn(async (draft) => finalizeEvent(draft, key));
    const auth = new AuthenticationSigner(signer(sign));
    const request = auth.signEvent(nip42.makeAuthEvent(url, "challenge"));
    await auth.authenticate(url);
    await request;
    expect(auth.getRelayState(url)?.status).toBe("success");
    expect(auth.authenticate(url)).toBeUndefined();
    expect(sign).toHaveBeenCalledTimes(1);
  });
});
