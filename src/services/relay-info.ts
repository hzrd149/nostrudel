import { AbstractRelay } from "nostr-tools/abstract-relay";
import { Nip11Registry } from "rx-nostr";

import db from "./db";
import { logger } from "../helpers/debug";

const log = logger.extend("Nip11Registry");

db.transaction("relayInfo", "readonly")
  .objectStore("relayInfo")
  .openCursor()
  .then(async (cursor) => {
    let loaded = 0;

    while (cursor) {
      try {
        Nip11Registry.set(cursor.key as string, cursor.value);
        loaded++;
      } catch (error) {}
      cursor = await cursor.continue();
    }

    log(`Loaded ${loaded} relay info`);
  });

async function getInfo(relay: string | AbstractRelay, alwaysFetch = false) {
  relay = typeof relay === "string" ? relay : relay.url;

  let info = Nip11Registry.get(relay);

  if (!info || alwaysFetch) {
    info = await Nip11Registry.fetch(relay);
    db.put("relayInfo", info, relay);
  }
  return info;
}

export const relayInfoService = { getInfo };

if (import.meta.env.DEV) {
  // @ts-ignore
  window.relayInfoService = relayInfoService;
  // @ts-ignore
  window.Nip11Registry = Nip11Registry;
}

export default relayInfoService;
