import { Filter, nip19 } from "nostr-tools";

export async function processFilter(f: Filter): Promise<Filter> {
  const filter = JSON.parse(JSON.stringify(f)) as Filter;

  if (filter.authors)
    filter.authors = filter.authors.map((p) => {
      if (p.startsWith("npub")) return nip19.decode(p).data as string;
      return p;
    });

  return filter;
}
