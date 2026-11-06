import type { NostrEvent } from "nostr-tools";

/** Stable app namespace used by napplet.soy's soy-rtc/1 signaling profile. */
export function getNappletWebrtcIdentity(event: NostrEvent) {
  if (event.kind !== 5129)
    return `${event.pubkey}:${event.kind}:${event.tags.find((tag) => tag[0] === "d")?.[1] ?? ""}`;
  const legacy =
    !event.tags.some((tag) => tag[0] === "x" && tag.length === 2) &&
    event.tags.some((tag) => tag[0] === "path" || (tag[0] === "x" && tag[2] === "aggregate"));
  const address = legacy ? event.tags.find((tag) => tag[0] === "a")?.[1] : undefined;
  if (address) {
    const [kind, author, ...identifier] = address.split(":");
    if (author === event.pubkey) return `${author}:${kind}:${identifier.join(":")}`;
    return `${event.pubkey}:5129:${address}`;
  }
  return `${event.pubkey}:5129:${event.id}`;
}
