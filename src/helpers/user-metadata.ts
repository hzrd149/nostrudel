import { Kind0ParsedContent } from "../types/nostr-event";

export function getUserFullName(metadata: Kind0ParsedContent) {
  if (metadata?.display_name && metadata?.name) {
    return `${metadata.display_name} (${metadata.name})`;
  } else if (metadata?.name) {
    return metadata.name;
  }
}
