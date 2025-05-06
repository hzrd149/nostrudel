import { Relay } from "applesauce-relay";
import { nip11 } from "nostr-tools";
import { RelayInformation } from "nostr-tools/nip11";
import { from } from "rxjs";
import { fetchWithProxy } from "../helpers/request";

import db from "./database";

// Use CORS fetch implementation
nip11.useFetchImplementation(fetchWithProxy);

async function getInfo(relay: string, alwaysFetch = false): Promise<RelayInformation | null> {
  let info = (await db.get("relayInfo", relay)) as RelayInformation | null;

  if (!info || alwaysFetch) {
    try {
      info = await nip11.fetchRelayInformation(relay);
      db.put("relayInfo", info, relay);
    } catch (error) {
      return null;
    }
  }
  return info;
}

export const relayInfoService = { getInfo };

Relay.fetchInformationDocument = (url) => from(getInfo(url, true));

if (import.meta.env.DEV) {
  // @ts-ignore
  window.relayInfoService = relayInfoService;
}

export default relayInfoService;
