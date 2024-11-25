import { AbstractRelay } from "nostr-tools/abstract-relay";

import SuperMap from "../classes/super-map";
import { localRelay } from "./local-relay";
import relayPoolService from "./relay-pool";
import Process from "../classes/process";
import { LightningIcon } from "../components/icons";
import processManager from "./process-manager";
import { logger } from "../helpers/debug";
import BatchKindPubkeyLoader from "../classes/batch-kind-pubkey-loader";
import { eventStore } from "./event-store";
import { SET_KINDS } from "../helpers/nostr/lists";

class UserSetsService {
  log = logger.extend("UserSetsService");
  process: Process;

  private loaded = new Map<string, boolean>();
  loaders = new SuperMap<AbstractRelay, BatchKindPubkeyLoader>((relay) => {
    const loader = new BatchKindPubkeyLoader(eventStore, relay, this.log.extend(relay.url));
    this.process.addChild(loader.process);
    return loader;
  });

  constructor() {
    this.process = new Process("UserSetsService", this);
    this.process.icon = LightningIcon;
    this.process.active = true;

    processManager.registerProcess(this.process);
  }

  requestSets(pubkey: string, urls: Iterable<string | URL | AbstractRelay>, alwaysRequest = true) {
    if (this.loaded.get(pubkey) && !alwaysRequest) return;

    const loaders: BatchKindPubkeyLoader[] = [];

    if (localRelay) loaders.push(this.loaders.get(localRelay as AbstractRelay));

    const relays = relayPoolService.getRelays(urls);
    for (const relay of relays) loaders.push(this.loaders.get(relay));

    for (const loader of loaders) {
      for (const kind of SET_KINDS) {
        loader.requestEvent(kind, pubkey);
      }
    }
  }
}

const userSetsService = new UserSetsService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userSetsService = userSetsService;
}

export default userSetsService;
