import { isReplaceable, normalizeURL } from "applesauce-core/helpers";
import { onlyEvents } from "applesauce-relay";
import { Filter, NostrEvent } from "nostr-tools";
import { BehaviorSubject, Observable } from "rxjs";

import { getSupportedNIPs, MONITOR_STATS_KIND } from "../helpers/nostr/relay-stats";
import { cacheRequest, writeEvent } from "./event-cache";
import pool from "./pool";

// Discovery relays for NIP-66
const DISCOVERY_RELAYS = ["wss://relay.nostr.watch", "wss://monitorlizard.nostr1.com"];

// Default monitor pubkey (can be overridden)
const DEFAULT_MONITORS: string[] = ["9b85d54cc4bc886d60782f80d676e41bc637ed3ecc73d2bb5aabadc499d6a340"];

export interface RelayInfo {
  url: string;
  event: NostrEvent;
  supportedNips?: number[];
  network?: string;
  country?: string;
}

class NIP66RelayDiscovery {
  private relayEvents$ = new BehaviorSubject<Map<string, NostrEvent>>(new Map());
  private subscription: any = null;
  private lastFetch = 0;
  private CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour cache

  constructor() {
    this.loadCachedEvents();
  }

  private async loadCachedEvents() {
    try {
      // Load cached 30166 events from event cache
      const filter: Filter = {
        kinds: [MONITOR_STATS_KIND],
        since: Math.round(Date.now() / 1000) - 60 * 60 * 24, // Last 24 hours
      };

      const cached = cacheRequest([filter]);
      const relayMap = new Map<string, NostrEvent>();

      cached.subscribe((event) => {
        if (event && event.kind === MONITOR_STATS_KIND) {
          const url = event.tags.find((t) => t[0] === "d")?.[1];
          if (url) {
            const normalizedUrl = normalizeURL(url);

            // Only keep the most recent event for each relay
            const existing = relayMap.get(normalizedUrl);
            if (!existing || existing.created_at < event.created_at) {
              relayMap.set(normalizedUrl, event);
            }
          }
        }
      });

      // Wait a bit for cache to load
      setTimeout(() => {
        if (relayMap.size > 0) {
          this.relayEvents$.next(relayMap);
          this.lastFetch = Date.now();
        }
      }, 100);
    } catch (error) {
      console.error("Failed to load cached relay events:", error);
    }
  }

  private subscribe(monitors: string[] = DEFAULT_MONITORS) {
    const since = Math.round(Date.now() / 1000) - 60 * 60 * 24;

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    const filter: Filter = {
      kinds: [MONITOR_STATS_KIND],
      since,
    };

    if (monitors!.length) {
      filter.authors = monitors;
    }

    this.subscription = pool
      .subscription(DISCOVERY_RELAYS, filter)
      .pipe(onlyEvents())
      .subscribe((event) => {
        if (isReplaceable(event.kind)) {
          const url = event.tags.find((t) => t[0] === "d")?.[1];
          if (url) {
            const normalizedUrl = normalizeURL(url);
            const currentMap = this.relayEvents$.value;

            // Check if we should update (either new or more recent)
            const existing = currentMap.get(normalizedUrl);
            if (!existing || existing.created_at < event.created_at) {
              const newMap = new Map(currentMap);
              newMap.set(normalizedUrl, event);
              this.relayEvents$.next(newMap);

              // Cache the event
              writeEvent(event);
            }
          }
        }
      });
  }

  public fetchRelays(
    monitors: string[] = DEFAULT_MONITORS,
    forceRefresh: boolean = false,
  ): Observable<Map<string, NostrEvent>> {
    // Check if we need to refresh
    if (forceRefresh || Date.now() - this.lastFetch > this.CACHE_DURATION || !this.subscription) {
      this.subscribe(monitors);
      this.lastFetch = Date.now();
    }

    return this.relayEvents$.asObservable();
  }

  public getOnlineRelays(): string[] {
    const relayMap = this.relayEvents$.value;
    return Array.from(relayMap.keys());
  }

  public getRelaysByNIPs(nips: number[]): string[] {
    const relayMap = this.relayEvents$.value;
    const matching: string[] = [];

    for (const [url, event] of relayMap.entries()) {
      const supportedNips = getSupportedNIPs(event)?.filter((n): n is number => typeof n === "number" && !isNaN(n));
      if (supportedNips && nips.every((nip) => supportedNips.includes(nip))) {
        matching.push(url);
      }
    }

    return matching;
  }

  public getRelaysByNetwork(network: string): string[] {
    const relayMap = this.relayEvents$.value;
    const matching: string[] = [];

    for (const [url, event] of relayMap.entries()) {
      const relayNetwork = event.tags.find((t) => t[0] === "n")?.[1];
      if (relayNetwork === network) {
        matching.push(url);
      }
    }

    return matching;
  }

  public getRelaysByCountry(country: string): string[] {
    const relayMap = this.relayEvents$.value;
    const matching: string[] = [];

    for (const [url, event] of relayMap.entries()) {
      const relayCountry = event.tags.find((t) => t[0] === "l" && (t[2] === "countryCode" || !t[2]))?.[1];
      if (relayCountry === country) {
        matching.push(url);
      }
    }

    return matching;
  }

  public getRelaysByFilters(filters: { network?: string; country?: string; nips?: number[] }): string[] {
    const relayMap = this.relayEvents$.value;
    let matching: string[] = Array.from(relayMap.keys());

    if (filters.network) {
      matching = matching.filter((url) => {
        const event = relayMap.get(url)!;
        const relayNetwork = event.tags.find((t) => t[0] === "n")?.[1];
        return relayNetwork === filters.network;
      });
    }

    if (filters.country) {
      matching = matching.filter((url) => {
        const event = relayMap.get(url)!;
        const relayCountry = event.tags.find((t) => t[0] === "l" && (t[2] === "countryCode" || !t[2]))?.[1];
        return relayCountry === filters.country;
      });
    }

    if (filters.nips && filters.nips.length > 0) {
      matching = matching.filter((url) => {
        const event = relayMap.get(url)!;
        const supportedNips = getSupportedNIPs(event)?.filter((n): n is number => typeof n === "number" && !isNaN(n));
        return supportedNips && filters.nips!.every((nip) => supportedNips.includes(nip));
      });
    }

    return matching;
  }

  public getAllRelayInfo(): RelayInfo[] {
    const relayMap = this.relayEvents$.value;
    const relays: RelayInfo[] = [];

    for (const [url, event] of relayMap.entries()) {
      const nips = getSupportedNIPs(event);
      relays.push({
        url,
        event,
        supportedNips: nips?.filter((n): n is number => typeof n === "number" && !isNaN(n)),
        network: event.tags.find((t) => t[0] === "n")?.[1],
        country: event.tags.find((t) => t[0] === "l" && t[2] === "countryCode")?.[1],
      });
    }

    return relays;
  }

  public cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}

// Export singleton instance
export const nip66Discovery = new NIP66RelayDiscovery();
export default nip66Discovery;
