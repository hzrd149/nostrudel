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

async function saveInfo() {
  log("Saving relay info");
  const cache = Reflect.get(Nip11Registry, "cache") as Map<string, any>;

  const tx = db.transaction("relayInfo", "readwrite");
  await Promise.all(
    Array.from(cache.entries())
      .filter(([url, info]) => Object.keys(info).length > 0)
      .map(([url, info]) => tx.store.put(info, url)),
  );
  await tx.done;
}

async function getInfo(relay: string, alwaysFetch = false) {
  let info = Nip11Registry.get(relay);

  if (!info || alwaysFetch) {
    info = await Nip11Registry.fetch(relay);
    db.put("relayInfo", info, relay);
  }
  return info;
}

setInterval(() => {
  saveInfo();
}, 10_000);

export const relayInfoService = { getInfo };

if (import.meta.env.DEV) {
  // @ts-ignore
  window.relayInfoService = relayInfoService;
  // @ts-ignore
  window.Nip11Registry = Nip11Registry;
}

export default relayInfoService;
