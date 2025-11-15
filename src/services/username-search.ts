import localSettings from "./preferences";
import { primalLookup } from "./lookup/primal";
import { vertexLookup } from "./lookup/vertex";
import { lookupRelatr } from "./lookup/relatr";
import { ProfilePointer } from "nostr-tools/nip19";

export type LookupProvider = "primal" | "vertex" | "relatr";
export type SearchResult = ProfilePointer & { query: string };

/**
 * Lookup users by username using the configured provider
 */
export async function lookupUsers(query: string, limit: number = 10): Promise<SearchResult[]> {
  const provider = localSettings.usernameLookupProvider.value as LookupProvider;

  let results: ProfilePointer[] = [];
  switch (provider) {
    case "primal":
      results = await primalLookup(query, limit);
    case "vertex":
      results = await vertexLookup(query, limit);
    case "relatr":
      results = await lookupRelatr(query, limit);
  }

  return results.map((result) => ({ ...result, query }));
}
