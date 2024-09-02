import dayjs from "dayjs";
import db from "./db";
import _throttle from "lodash.throttle";

import { fetchWithProxy } from "../helpers/request";
import SuperMap from "../classes/super-map";
import Subject from "../classes/subject";

export function parseAddress(address: string): { name?: string; domain?: string } {
  const parts = address.trim().toLowerCase().split("@");
  if (parts.length === 1) return { name: "_", domain: parts[0] };
  else return { name: parts[0], domain: parts[1] };
}

type IdentityJson = {
  names?: Record<string, string | undefined>;
  relays?: Record<string, string[]>;
  nip46?: Record<string, string[]>;
};
export type DnsIdentity = {
  name: string;
  domain: string;
  /** If the nostr.json file exists */
  exists: boolean;
  /** pubkey found for name */
  pubkey?: string;
  /** relays found for name */
  relays?: string[];
  hasNip46?: boolean;
  nip46Relays?: string[];
};

function getIdentityFromJson(name: string, domain: string, json: IdentityJson): DnsIdentity {
  if (!json.names) return { name, domain, exists: true };
  const pubkey = json.names[name];
  if (!pubkey) return { name, domain, exists: true };

  const relays: string[] = json.relays?.[pubkey] ?? [];
  const hasNip46 = !!json.nip46;
  const nip46Relays = json.nip46?.[pubkey];
  return { name, domain, pubkey, relays, nip46Relays, hasNip46, exists: true };
}

class DnsIdentityService {
  // undefined === loading
  identities = new SuperMap<string, Subject<DnsIdentity | undefined>>(() => new Subject());

  async fetchIdentity(address: string): Promise<DnsIdentity> {
    const { name, domain } = parseAddress(address);
    if (!name || !domain) throw new Error("invalid address " + address);

    const res = await fetchWithProxy(`https://${domain}/.well-known/nostr.json?name=${name}`);

    // if request was rejected consider identity invalid
    if (res.status >= 400 && res.status < 500) return { name, domain, exists: false };

    const json = await (res.json() as Promise<IdentityJson>).then((json) => {
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
    if (!json.names) return;

    const now = dayjs().unix();
    const transaction = db.transaction("dnsIdentifiers", "readwrite");

    for (const name of Object.keys(json.names)) {
      const identity = getIdentityFromJson(name, domain, json);
      if (identity && identity.exists && identity.pubkey) {
        const address = `${name}@${domain}`;

        // add to memory cache
        this.identities.get(address).next(identity);

        // ad to db cache
        if (transaction.store.put) {
          await transaction.store.put(
            {
              name: identity.name,
              domain: identity.domain,
              pubkey: identity.pubkey,
              relays: identity.relays ?? [],
              updated: now,
            },
            address,
          );
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
      if (fromDb) sub.next({ exists: true, ...fromDb });
      this.loading.delete(address);
    });

    if (!sub.value || alwaysFetch) {
      this.fetchIdentity(address)
        .then((identity) => {
          sub.next(identity);
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
