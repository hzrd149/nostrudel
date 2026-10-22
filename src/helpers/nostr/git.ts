import { GIT_REPOSITORY_KIND } from "applesauce-common/helpers";
import { decodeAddressPointer, decodeProfilePointer } from "applesauce-core/helpers";
import { ensureWebSocketURL } from "applesauce-core/helpers/url";

/** A NIP-34 repository reference parsed from a `nostr://` clone URL */
export type NostrRepositoryUri = {
  /** Hex pubkey of the repository owner, set when the URL uses an npub or naddr */
  pubkey?: string;
  /** NIP-05 address of the repository owner, set when the URL uses one instead of an npub */
  nip05?: string;
  identifier: string;
  relays: string[];
};

/**
 * Parses a NIP-34 `nostr://` clone URL:
 * `nostr://<naddr>`, `nostr://<npub|nip05>/<identifier>` or `nostr://<npub|nip05>/<relay-hint>/<identifier>`
 */
export function parseNostrRepositoryUri(uri: string): NostrRepositoryUri | undefined {
  if (!uri.startsWith("nostr://")) return undefined;
  const parts = uri.slice("nostr://".length).replace(/\/+$/, "").split("/");

  try {
    if (parts.length === 1) {
      const pointer = decodeAddressPointer(parts[0]);
      if (pointer?.kind !== GIT_REPOSITORY_KIND) return undefined;
      return { pubkey: pointer.pubkey, identifier: pointer.identifier, relays: pointer.relays ?? [] };
    }
    if (parts.length > 3) return undefined;

    const [owner, ...rest] = parts;
    const identifier = decodeURIComponent(rest[rest.length - 1]);
    const relays = rest.length === 2 ? [ensureWebSocketURL(decodeURIComponent(rest[0]))] : [];
    if (!identifier) return undefined;

    const pubkey = owner.startsWith("npub1") ? decodeProfilePointer(owner)?.pubkey : undefined;
    if (pubkey) return { pubkey, identifier, relays };
    if (owner.includes(".")) return { nip05: owner, identifier, relays };
  } catch {
    // Malformed percent-encoding or relay hint: not a repository URL we can open
  }
  return undefined;
}
