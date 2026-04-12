/**
 * Namecoin NIP-05 identity resolver
 *
 * Resolves .bit domains, d/ and id/ Namecoin names to Nostr pubkeys
 * by querying an ElectrumX HTTP proxy.
 */

import { Identity, IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { ParsedNamecoinIdentifier, NamecoinNostrResult } from "./types";
import { DEFAULT_PROXY_PATH, DEFAULT_CACHE_TTL } from "./constants";

// ── Identifier detection & parsing ──────────────────────────────────

/** Check if a NIP-05-style address is a Namecoin identifier */
export function isNamecoinIdentifier(address: string): boolean {
  if (!address) return false;
  const lower = address.toLowerCase();
  return lower.endsWith(".bit") || lower.startsWith("d/") || lower.startsWith("id/");
}

/**
 * Parse a NIP-05 address or raw Namecoin name into its components.
 *
 * Supported formats:
 *  - alice@example.bit  → d/example, localPart=alice
 *  - _@example.bit      → d/example, root
 *  - example.bit        → d/example, root
 *  - d/example          → d/example, root
 *  - id/alice           → id/alice
 */
export function parseNamecoinIdentifier(raw: string): ParsedNamecoinIdentifier | null {
  if (!raw) return null;
  const input = raw.trim().toLowerCase();

  // Direct namespace format: d/name or id/name
  if (input.startsWith("d/")) {
    const name = input.slice(2);
    if (!name) return null;
    return { namecoinName: `d/${name}`, namespace: "d", name, originalAddress: raw };
  }
  if (input.startsWith("id/")) {
    const name = input.slice(3);
    if (!name) return null;
    return { namecoinName: `id/${name}`, namespace: "id", name, originalAddress: raw };
  }

  // NIP-05 style: [user@]domain.bit
  if (input.endsWith(".bit")) {
    const atIndex = input.indexOf("@");
    let localPart: string | undefined;
    let domain: string;

    if (atIndex !== -1) {
      localPart = input.slice(0, atIndex);
      domain = input.slice(atIndex + 1);
      // "_" means root (like NIP-05 convention)
      if (localPart === "_") localPart = undefined;
    } else {
      domain = input;
    }

    // Strip .bit suffix to get the Namecoin d/ name
    const name = domain.slice(0, -4); // remove ".bit"
    if (!name) return null;

    return {
      namecoinName: `d/${name}`,
      namespace: "d",
      name,
      localPart,
      originalAddress: raw,
    };
  }

  return null;
}

// ── LRU Cache ───────────────────────────────────────────────────────

interface CacheEntry {
  result: NamecoinNostrResult | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 200;

function getCached(key: string, ttl: number): NamecoinNostrResult | null | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return undefined;
  }
  return entry.result;
}

function setCache(key: string, result: NamecoinNostrResult | null) {
  // Simple LRU: delete oldest when over limit
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { result, timestamp: Date.now() });
}

// ── Proxy resolution ────────────────────────────────────────────────

function getProxyUrl(): string {
  // Check for explicit env var first, then fall back to dev middleware path
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_NAMECOIN_PROXY_URL) {
    return import.meta.env.VITE_NAMECOIN_PROXY_URL;
  }
  return DEFAULT_PROXY_PATH;
}

/**
 * Resolve a parsed Namecoin identifier via the ElectrumX HTTP proxy.
 * Returns null if the name doesn't exist or has no Nostr data.
 */
export async function resolveNamecoinViaProxy(
  parsed: ParsedNamecoinIdentifier,
  proxyUrl?: string,
): Promise<NamecoinNostrResult | null> {
  const base = proxyUrl || getProxyUrl();
  const url = `${base}/lookup/${encodeURIComponent(parsed.namecoinName)}`;

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Namecoin proxy error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data || data.expired) return null;

  const value = data.value;
  if (!value) return null;

  let parsed_value: Record<string, unknown>;
  try {
    parsed_value = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }

  return extractNostrData(parsed_value, parsed);
}

/**
 * Extract Nostr pubkey and relays from a Namecoin name value.
 *
 * d/ namespace format:
 *   {"nostr": {"names": {"alice": "hex64"}, "relays": {"hex64": ["wss://..."]}}}
 *   {"nostr": "hex64"}  (shorthand, root identity)
 *
 * id/ namespace format:
 *   {"nostr": "hex64"}
 *   {"nostr": {"pubkey": "hex64", "relays": ["wss://..."]}}
 */
function extractNostrData(
  value: Record<string, unknown>,
  parsed: ParsedNamecoinIdentifier,
): NamecoinNostrResult | null {
  const nostr = value.nostr;
  if (!nostr) return null;

  // id/ namespace
  if (parsed.namespace === "id") {
    if (typeof nostr === "string" && isValidHexPubkey(nostr)) {
      return { pubkey: nostr };
    }
    if (typeof nostr === "object" && nostr !== null) {
      const obj = nostr as Record<string, unknown>;
      const pubkey = obj.pubkey;
      if (typeof pubkey === "string" && isValidHexPubkey(pubkey)) {
        const relays = Array.isArray(obj.relays) ? (obj.relays as string[]) : undefined;
        return { pubkey, relays };
      }
    }
    return null;
  }

  // d/ namespace
  if (typeof nostr === "string" && isValidHexPubkey(nostr)) {
    // Shorthand: root identity only
    if (!parsed.localPart) return { pubkey: nostr };
    return null; // shorthand doesn't support named users
  }

  if (typeof nostr === "object" && nostr !== null) {
    const obj = nostr as Record<string, unknown>;
    const names = obj.names as Record<string, string> | undefined;
    if (!names) return null;

    // Look up the local part (or "_" for root)
    const lookupKey = parsed.localPart || "_";
    const pubkey = names[lookupKey];
    if (!pubkey || !isValidHexPubkey(pubkey)) return null;

    // Check for relays
    const relaysMap = obj.relays as Record<string, string[]> | undefined;
    const relays = relaysMap?.[pubkey];

    return { pubkey, relays: relays?.length ? relays : undefined };
  }

  return null;
}

function isValidHexPubkey(s: string): boolean {
  return /^[0-9a-f]{64}$/.test(s);
}

// ── Main resolution function ────────────────────────────────────────

/**
 * Resolve a Namecoin identifier to a Nostr pubkey.
 * Uses an in-memory LRU cache.
 */
export async function resolveNamecoin(
  address: string,
  proxyUrl?: string,
): Promise<NamecoinNostrResult | null> {
  const parsed = parseNamecoinIdentifier(address);
  if (!parsed) return null;

  const cacheKey = parsed.localPart
    ? `${parsed.namecoinName}:${parsed.localPart}`
    : parsed.namecoinName;

  const cached = getCached(cacheKey, DEFAULT_CACHE_TTL);
  if (cached !== undefined) return cached;

  try {
    const result = await resolveNamecoinViaProxy(parsed, proxyUrl);
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.warn("[Namecoin] Resolution failed for", address, err);
    return null;
  }
}

// ── Identity conversion ─────────────────────────────────────────────

/**
 * Convert a Namecoin resolution result to an applesauce Identity object,
 * compatible with noStrudel's existing NIP-05 display pipeline.
 */
export function toIdentity(
  address: string,
  result: NamecoinNostrResult | null,
  error?: string,
): Identity {
  const parsed = parseNamecoinIdentifier(address);
  const name = parsed?.localPart || parsed?.name || "_";
  const domain = parsed?.namespace === "id" ? `id/${parsed.name}` : `${parsed?.name || "unknown"}.bit`;

  if (error) {
    return { name, domain, status: IdentityStatus.Error, error, checked: Date.now() / 1000 };
  }
  if (!result) {
    return { name, domain, status: IdentityStatus.Missing, checked: Date.now() / 1000 };
  }
  return {
    name,
    domain,
    status: IdentityStatus.Found,
    pubkey: result.pubkey,
    relays: result.relays,
    checked: Date.now() / 1000,
  };
}
