import dayjs from "dayjs";
import db from "./db";
import _throttle from "lodash.throttle";

import { fetchWithCorsFallback } from "../helpers/cors";
import { SuperMap } from "../classes/super-map";
import Subject from "../classes/subject";

export function parseAddress(address: string): { name?: string; domain?: string } {
  const parts = address.trim().toLowerCase().split("@");
  return { name: parts[0], domain: parts[1] };
}

type IdentityJson = {
  names: Record<string, string | undefined>;
  relays?: Record<string, string[]>;
};
export type DnsIdentity = {
  name: string;
  domain: string;
  pubkey: string;
  relays: string[];
};

function getIdentityFromJson(name: string, domain: string, json: IdentityJson): DnsIdentity | undefined {
  const pubkey = json.names[name];
  if (!pubkey) return;

  const relays: string[] = json.relays?.[pubkey] ?? [];
  return { name, domain, pubkey, relays };
}

class DnsIdentityService {
  identities = new SuperMap<string, Subject<DnsIdentity | null>>(() => new Subject());

  async fetchIdentity(address: string) {
    const { name, domain } = parseAddress(address);
    if (!name || !domain) throw new Error("invalid address");

    const json = await fetchWithCorsFallback(`https://${domain}/.well-known/nostr.json?name=${name}`)
      .then((res) => res.json() as Promise<IdentityJson>)
      .then((json) => {
        // convert all keys in names, and relays to lower case
        if (json.names) {
          for (const [name, pubkey] of Object.entries(json.names)) {
            delete json.names[name];
            json.names[name.toLowerCase()] = pubkey;
          }
        }
        if (json.relays) {
          for (const [name, pubkey] of Object.entries(json.relays)) {
            delete json.relays[name];
            json.relays[name.toLowerCase()] = pubkey;
          }
        }
        return json;
      });

    await this.addToCache(domain, json);

    return getIdentityFromJson(name, domain, json);
  }

  async addToCache(domain: string, json: IdentityJson) {
    const now = dayjs().unix();
    const transaction = db.transaction("dnsIdentifiers", "readwrite");

    for (const name of Object.keys(json.names)) {
      const identity = getIdentityFromJson(name, domain, json);
      if (identity) {
        const address = `${name}@${domain}`;

        // add to memory cache
        this.identities.get(address).next(identity);

        // ad to db cache
        if (transaction.store.put) {
          await transaction.store.put({ ...identity, updated: now }, address);
        }
      }
    }
    await transaction.done;
  }

  loading = new Set<string>();
  getIdentity(address: string, alwaysFetch = false) {
    const sub = this.identities.get(address);

    if (this.loading.has(address)) return sub;
    this.loading.add(address);

    db.get("dnsIdentifiers", address).then((fromDb) => {
      if (fromDb) sub.next(fromDb);
      this.loading.delete(address);
    });

    if (!sub.value || alwaysFetch) {
      this.fetchIdentity(address)
        .then((identity) => {
          sub.next(identity ?? null);
        })
        .finally(() => {
          this.loading.delete(address);
        });
    }

    return sub;
  }

  async pruneCache() {
    const keys = await db.getAllKeysFromIndex(
      "dnsIdentifiers",
      "updated",
      IDBKeyRange.upperBound(dayjs().subtract(1, "day").unix()),
    );

    for (const pubkey of keys) {
      db.delete("dnsIdentifiers", pubkey);
    }
  }
}

export const dnsIdentityService = new DnsIdentityService();

setInterval(() => {
  dnsIdentityService.pruneCache();
}, 1000 * 60);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.dnsIdentityService = dnsIdentityService;
}

export default dnsIdentityService;
