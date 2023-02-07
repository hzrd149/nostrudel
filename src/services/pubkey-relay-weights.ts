import moment from "moment";
import db from "./db";
import { UserContacts } from "./user-contacts";

const changed = new Set();
const cache: Record<string, Record<string, number> | undefined> = {};

async function populateCacheFromDb(pubkey: string) {
  if (!cache[pubkey]) {
    cache[pubkey] = (await db.get("pubkeyRelayWeights", pubkey))?.relays;
  }
}

async function addWeight(pubkey: string, relay: string, weight: number = 1) {
  await populateCacheFromDb(pubkey);

  const relays = cache[pubkey] || (cache[pubkey] = {});

  if (relays[relay]) {
    relays[relay] += weight;
  } else {
    relays[relay] = weight;
  }
  changed.add(pubkey);
}

async function saveCache() {
  const now = moment().unix();
  const transaction = db.transaction("pubkeyRelayWeights", "readwrite");

  for (const [pubkey, relays] of Object.entries(cache)) {
    if (changed.has(pubkey)) {
      if (relays) transaction.store?.put({ pubkey, relays, updated: now });
    }
  }
  changed.clear();
}

async function handleContactList(contacts: UserContacts) {
  // save the relays for contacts
  for (const [pubkey, relay] of Object.entries(contacts.contactRelay)) {
    if (relay) await addWeight(pubkey, relay);
  }

  // save this pubkeys relays
  for (const [relay, opts] of Object.entries(contacts.relays)) {
    // only save relays this users writes to
    if (opts.write) {
      await addWeight(contacts.pubkey, relay);
    }
  }
}

async function getPubkeyRelays(pubkey: string) {
  await populateCacheFromDb(pubkey);
  return cache[pubkey] || {};
}
const pubkeyRelayWeightsService = {
  handleContactList,
  getPubkeyRelays,
};

setInterval(() => saveCache(), 1000);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.pubkeyRelayWeightsService = pubkeyRelayWeightsService;
}

export default pubkeyRelayWeightsService;
