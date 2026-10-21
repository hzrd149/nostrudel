import {
  DecodeResult,
  getAddressPointerFromATag,
  getEventPointerFromETag,
  getProfilePointerFromPTag,
  isRTag,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { decode } from "nostr-tools/nip19";

/** @deprecated */
export function getPointerFromTag(tag: string[]): ReturnType<typeof decode> | null {
  // v5: decode functions return null instead of throwing
  switch (tag[0]) {
    case "e": {
      const pointer = getEventPointerFromETag(tag);
      return pointer ? { type: "nevent", data: pointer } : null;
    }
    case "a": {
      const pointer = getAddressPointerFromATag(tag);
      return pointer ? { type: "naddr", data: pointer } : null;
    }
    case "p": {
      const pointer = getProfilePointerFromPTag(tag);
      return pointer ? { type: "nprofile", data: pointer } : null;
    }
    // NIP-18 quote tags
    case "q": {
      const pointer = getEventPointerFromETag(tag);
      return pointer ? { type: "nevent", data: pointer } : null;
    }
  }

  return null;
}

export function getGoalLinks(goal: NostrEvent) {
  return goal.tags.filter(isRTag).map((t) => t[1]);
}
export function getGoalEventPointers(goal: NostrEvent) {
  const pointers: DecodeResult[] = [];

  for (const tag of goal.tags) {
    const decoded = getPointerFromTag(tag);

    if (decoded?.type === "naddr" || decoded?.type === "nevent") {
      pointers.push(decoded);
    }
  }

  return pointers;
}
