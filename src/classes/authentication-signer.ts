import { unixNow } from "applesauce-core/helpers";
import { createDefer, Deferred } from "applesauce-core/promise";
import { Nip07Interface } from "applesauce-signers";
import { EventTemplate, kinds, NostrEvent } from "nostr-tools";
import { BehaviorSubject, distinctUntilChanged } from "rxjs";

import { logger } from "../helpers/debug";

export type RelayAuthMode = "always" | "ask" | "never";

type HasChallenge = { template: EventTemplate; challenge: string };
export type RelayAuthDormantState = { status: "dormant" };
export type RelayAuthRequestedState = { status: "requested"; promise: Deferred<NostrEvent> } & HasChallenge;
export type RelayAuthSigningState = { status: "signing"; promise: Deferred<NostrEvent> } & HasChallenge;
export type RelayAuthRejectedState = { status: "rejected"; reason: string };
export type RelayAuthSuccessState = { status: "success" };

export type RelayAuthState =
  | RelayAuthDormantState
  | RelayAuthRequestedState
  | RelayAuthSigningState
  | RelayAuthRejectedState
  | RelayAuthSuccessState;

/** A wrapper signer class that only signs NIP-42 authentication requests and respects users privacy preferences */
export default class AuthenticationSigner {
  protected log = logger.extend("AuthenticationSigner");

  relayState$ = new BehaviorSubject<Record<string, RelayAuthState>>({});
  get relayState() {
    return this.relayState$.value;
  }

  protected get signer() {
    if (this.upstream instanceof BehaviorSubject) return this.upstream.value;
    else return this.upstream;
  }
  constructor(protected upstream: Nip07Interface | BehaviorSubject<Nip07Interface | undefined>) {
    if (upstream instanceof BehaviorSubject) {
      upstream.pipe(distinctUntilChanged()).subscribe(() => {
        for (const relay of Object.keys(this.relayState)) this.cancel(relay);
      });
    }
  }

  defaultMode: RelayAuthMode = "ask";
  relayMode = new Map<string, RelayAuthMode>();

  /** manually sign an authenticate request */
  authenticate(relay: string): Deferred<NostrEvent> | undefined {
    const state = this.getRelayState(relay);

    if (state?.status === "signing") return state.promise;

    // With no pending request (never requested, already signed, canceled or rejected) there is nothing to sign, so
    // undefined is returned instead of throwing; callers check the state first or treat undefined as nothing to do.
    if (state?.status !== "requested") return;

    const signer = this.signer;
    if (!signer) throw new Error("Missing signer");

    const log = this.log.extend(relay);
    log(`Requesting signature`);

    const promise = createDefer<NostrEvent>();
    this.setRelayState(relay, { status: "signing", promise, template: state.template, challenge: state.challenge });

    // update status after signing is complete
    const request = state.promise;
    promise.then(
      (event) => {
        log(`Authenticated with ${relay}`);
        const current = this.getRelayState(relay);
        if (current?.status === "signing" && current.promise === promise)
          this.setRelayState(relay, { status: "success" });
        request.resolve(event);
      },
      (err) => {
        const current = this.getRelayState(relay);
        if (current?.status !== "signing" || current.promise !== promise) {
          request.reject(err);
          return;
        }
        if (err instanceof Error) {
          log(`Failed ${err.message}`);
          this.setRelayState(relay, { status: "rejected", reason: err.message });
        } else this.setRelayState(relay, { status: "rejected", reason: "Unknown" });

        request.reject(err);
      },
    );

    try {
      // start signing request
      const result = signer.signEvent(state.template);

      if (result instanceof Promise) {
        result.then(
          (event) => promise.resolve(event),
          (err) => promise.reject(err),
        );
      } else {
        promise.resolve(result);
      }
    } catch (error) {
      promise.reject(error);
    }
    return promise;
  }

  /** cancel a pending authentication request */
  cancel(relay: string): void {
    const state = this.getRelayState(relay);
    if (!state) return;

    const log = this.log.extend(relay);
    log(`Canceling`);

    // reject the promise if it exists
    if (state.status === "requested" || state.status === "signing") state.promise.reject(new Error("Canceled"));

    this.clearRelayState(relay);
  }

  getRelayState(relay: string): RelayAuthState | undefined {
    return this.relayState$.value[relay];
  }
  protected setRelayState(relay: string, state: RelayAuthState) {
    this.relayState$.next({ ...this.relayState$.value, [relay]: state });
  }
  protected clearRelayState(relay: string) {
    if (!this.relayState$.value[relay]) return;

    this.setRelayState(relay, { status: "dormant" });
  }

  protected getRelayAuthMode(relay: string): RelayAuthMode {
    return this.relayMode.get(relay) || this.defaultMode;
  }

  /** handle relay state changes */
  handleRelayConnectionState(relay: string, connected: boolean) {
    // if the state is anything but connected, cancel any pending requests
    if (!connected) this.cancel(relay);
  }

  /** intercept sign requests and save them for later */
  signEvent(draft: EventTemplate): Promise<NostrEvent> {
    if (draft.kind !== kinds.ClientAuth) throw new Error("Event is not a client auth request");
    if (!draft.tags) throw new Error("Missing tags");

    let relay = draft.tags.find((t) => t[0] === "relay" && t[1])?.[1];
    if (!relay) throw new Error("Missing relay tag");

    // fix relay formatting
    relay = new URL(relay).toString();

    const log = this.log.extend(relay);

    log(`Got request for ${relay}`);
    const mode = this.getRelayAuthMode(relay);

    // throw if mode is set to "never"
    if (mode === "never") {
      log(`Automatically rejecting`);
      this.setRelayState(relay, { status: "rejected", reason: "Canceled" });
      return Promise.reject(new Error("Authentication rejected"));
    }

    const challenge = draft.tags.find((t) => t[0] === "challenge" && t[1])?.[1];
    if (!challenge) throw new Error("Missing challenge tag");

    const existing = this.getRelayState(relay);
    if (existing?.status === "requested" || existing?.status === "signing") {
      if (existing.challenge === challenge) return existing.promise;
      this.cancel(relay);
    }

    const promise = createDefer<NostrEvent>();

    // add to pending
    const template: EventTemplate = {
      ...draft,
      created_at: unixNow(),
    };
    this.setRelayState(relay, { status: "requested", template, challenge, promise });

    // start the authentication process imminently if set to "always"
    if (mode === "always") {
      log(`Automatically authenticating`);
      this.authenticate(relay);
    }

    return promise;
  }

  async getPublicKey(): Promise<string> {
    if (!this.signer) throw new Error("Missing signer");
    return await this.signer.getPublicKey();
  }
}
