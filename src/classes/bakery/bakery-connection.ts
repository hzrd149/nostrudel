import { BehaviorSubject, Subject } from "rxjs";
import { EventTemplate, Relay, VerifiedEvent } from "nostr-tools";
import { ControlMessage, ControlResponse } from "@satellite-earth/core/types";

import createDefer, { Deferred } from "../deferred";
import { logger } from "../../helpers/debug";

export default class BakeryConnection extends Relay {
  log = logger.extend("BakeryConnection");
  isFirstConnection = new BehaviorSubject(true);
  isFirstAuthentication = new BehaviorSubject(true);
  connectedSub = new BehaviorSubject(false);
  authenticated = new BehaviorSubject(false);
  onControlResponse = new Subject<ControlResponse>();

  constructor(url: string) {
    super(url);

    // override _connected property
    Object.defineProperty(this, "_connected", {
      get: () => this.connectedSub.value,
      set: (v) => {
        this.connectedSub.next(v);
        if (v && this.isFirstConnection.value) this.isFirstConnection.next(false);
      },
    });
  }

  sentAuthId = "";
  authPromise: Deferred<string> | null = null;

  onChallenge = new Subject<string | undefined>();

  authenticate(auth: string | ((evt: EventTemplate) => Promise<VerifiedEvent>)) {
    if (!this.connected) throw new Error("Not connected");

    if (!this.authenticated.value && !this.authPromise) {
      this.authPromise = createDefer<string>();

      if (this.isFirstAuthentication.value) this.authPromise.then(() => this.isFirstAuthentication.next(false));

      // CONTROL auth
      if (typeof auth === "string") {
        this.sendControlMessage(["CONTROL", "AUTH", "CODE", auth]);
        return this.authPromise;
      }

      // NIP-42 auth
      this.auth(auth)
        .then((response) => {
          this.authenticated.next(true);
          this.authPromise?.resolve(response);
          this.authPromise = null;
        })
        .catch((err) => {
          this.authPromise?.reject(err);
          this.authPromise = null;
        });
    }

    return this.authPromise;
  }

  _onauth = (challenge: string) => {
    this.onChallenge.next(challenge);
  };

  _onmessage(message: MessageEvent<string>) {
    try {
      // Parse control message(s) received from node
      const data = JSON.parse(message.data);

      switch (data[0]) {
        case "CONTROL":
          // const payload = Array.isArray(data[1]) ? data[1] : [data[1]];
          this.handleControlResponse(data as ControlResponse);
          return;
      }
    } catch (err) {
      console.log(err);
    }

    // use default relay message handling
    super._onmessage(message);
  }

  onclose = () => {
    this.authenticated.next(false);
    // @ts-expect-error
    this.connectionPromise = undefined;
    // remove the old challenge
    this.onChallenge.next(undefined);
  };

  close(): void {
    super.close();

    this.authenticated.next(false);
    // @ts-expect-error
    this.connectionPromise = undefined;
  }

  // Send control message to node
  sendControlMessage(message: ControlMessage) {
    return this.send(JSON.stringify(message));
  }

  // handle control response
  handleControlResponse(response: ControlResponse) {
    switch (response[1]) {
      case "AUTH":
        if (response[2] === "SUCCESS") {
          this.authenticated.next(true);
          this.authPromise?.resolve("Success");
        } else if (response[2] === "INVALID") {
          this.authPromise?.reject(new Error(response[3]));
        }
        this.authPromise = null;
        break;
      default:
        this.onControlResponse.next(response);
        break;
    }
  }

  /** @deprecated use controlApi instead */
  clearDatabase() {
    this.sendControlMessage(["CONTROL", "DATABASE", "CLEAR"]);
  }
  /** @deprecated use controlApi instead */
  exportDatabase() {
    this.sendControlMessage(["CONTROL", "DATABASE", "EXPORT"]);
  }
}
