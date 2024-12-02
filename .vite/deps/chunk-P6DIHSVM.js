import {
  naddrEncode,
  neventEncode,
  noteEncode,
  nprofileEncode,
  npubEncode,
  nrelayEncode,
  nsecEncode
} from "./chunk-MG7C4QW5.js";
import {
  getPublicKey,
  kinds_exports
} from "./chunk-EMHHNKI2.js";

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/event-store/common.js
var LETTERS = "abcdefghijklmnopqrstuvwxyz";
var INDEXABLE_TAGS = new Set((LETTERS + LETTERS.toUpperCase()).split(""));

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/helpers/event.js
var EventUIDSymbol = Symbol.for("event-uid");
var EventIndexableTagsSymbol = Symbol.for("indexable-tags");
function isReplaceable(kind) {
  return kinds_exports.isReplaceableKind(kind) || kinds_exports.isParameterizedReplaceableKind(kind);
}
function getEventUID(event) {
  var _a;
  let id = event[EventUIDSymbol];
  if (!id) {
    if (isReplaceable(event.kind)) {
      const d = (_a = event.tags.find((t) => t[0] === "d")) == null ? void 0 : _a[1];
      id = getReplaceableUID(event.kind, event.pubkey, d);
    } else {
      id = event.id;
    }
  }
  return id;
}
function getReplaceableUID(kind, pubkey, d) {
  return d ? `${kind}:${pubkey}:${d}` : `${kind}:${pubkey}`;
}
function getIndexableTags(event) {
  let indexable = event[EventIndexableTagsSymbol];
  if (!indexable) {
    const tags = /* @__PURE__ */ new Set();
    for (const tag of event.tags) {
      if (tag[0] && INDEXABLE_TAGS.has(tag[0]) && tag[1]) {
        tags.add(tag[0] + ":" + tag[1]);
      }
    }
    indexable = event[EventIndexableTagsSymbol] = tags;
  }
  return indexable;
}
function getTagValue(event, name) {
  var _a;
  return (_a = event.tags.find((t) => t[0] === name)) == null ? void 0 : _a[1];
}

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/helpers/relays.js
var SeenRelaysSymbol = Symbol.for("seen-relays");
function addSeenRelay(event, relay) {
  if (!event[SeenRelaysSymbol])
    event[SeenRelaysSymbol] = /* @__PURE__ */ new Set();
  event[SeenRelaysSymbol].add(relay);
  return event[SeenRelaysSymbol];
}
function getSeenRelays(event) {
  return event[SeenRelaysSymbol];
}
function validateRelayURL(relay) {
  if (typeof relay === "string" && relay.includes(",ws"))
    throw new Error("Can not have multiple relays in one string");
  const url = typeof relay === "string" ? new URL(relay) : relay;
  if (url.protocol !== "wss:" && url.protocol !== "ws:")
    throw new Error("Incorrect protocol");
  return url;
}
function safeRelayUrl(relayUrl) {
  try {
    return validateRelayURL(relayUrl).toString();
  } catch (e) {
    return null;
  }
}
function safeRelayUrls(urls) {
  return Array.from(urls).map(safeRelayUrl).filter(Boolean);
}

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/helpers/profile.js
var ProfileContentSymbol = Symbol.for("profile-content");
function getProfileContent(event, quite = false) {
  let cached = event[ProfileContentSymbol];
  if (!cached) {
    try {
      const profile = JSON.parse(event.content);
      if (profile.nip05 && typeof profile.nip05 !== "string")
        profile.nip05 = String(profile.nip05);
      cached = event[ProfileContentSymbol] = profile;
    } catch (e) {
      if (e instanceof Error)
        cached = event[ProfileContentSymbol] = e;
    }
  }
  if (cached === void 0) {
    throw new Error("Failed to parse profile");
  } else if (cached instanceof Error) {
    if (!quite)
      throw cached;
    else
      return cached;
  } else
    return cached;
}

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/helpers/mailboxes.js
var MailboxesInboxesSymbol = Symbol.for("mailboxes-inboxes");
var MailboxesOutboxesSymbol = Symbol.for("mailboxes-outboxes");
function getInboxes(event) {
  if (!event[MailboxesInboxesSymbol]) {
    const inboxes = /* @__PURE__ */ new Set();
    for (const tag of event.tags) {
      if (tag[0] === "r" && tag[1] && (tag[2] === "read" || tag[2] === void 0)) {
        const url = safeRelayUrl(tag[1]);
        if (url)
          inboxes.add(url);
      }
    }
    event[MailboxesInboxesSymbol] = inboxes;
  }
  return event[MailboxesInboxesSymbol];
}
function getOutboxes(event) {
  if (!event[MailboxesOutboxesSymbol]) {
    const outboxes = /* @__PURE__ */ new Set();
    for (const tag of event.tags) {
      if (tag[0] === "r" && tag[1] && (tag[2] === "write" || tag[2] === void 0)) {
        const url = safeRelayUrl(tag[1]);
        if (url)
          outboxes.add(url);
      }
    }
    event[MailboxesOutboxesSymbol] = outboxes;
  }
  return event[MailboxesOutboxesSymbol];
}

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/helpers/pointers.js
function parseCoordinate(a, requireD = false, silent = true) {
  const parts = a.split(":");
  const kind = parts[0] && parseInt(parts[0]);
  const pubkey = parts[1];
  const d = parts[2];
  if (!kind) {
    if (silent)
      return null;
    else
      throw new Error("Missing kind");
  }
  if (!pubkey) {
    if (silent)
      return null;
    else
      throw new Error("Missing pubkey");
  }
  if (requireD && d === void 0) {
    if (silent)
      return null;
    else
      throw new Error("Missing identifier");
  }
  return {
    kind,
    pubkey,
    identifier: d
  };
}
function getPubkeyFromDecodeResult(result) {
  if (!result)
    return;
  switch (result.type) {
    case "naddr":
    case "nprofile":
      return result.data.pubkey;
    case "npub":
      return result.data;
    case "nsec":
      return getPublicKey(result.data);
    default:
      return void 0;
  }
}
function encodeDecodeResult(result) {
  switch (result.type) {
    case "naddr":
      return naddrEncode(result.data);
    case "nprofile":
      return nprofileEncode(result.data);
    case "nevent":
      return neventEncode(result.data);
    case "nrelay":
      return nrelayEncode(result.data);
    case "nsec":
      return nsecEncode(result.data);
    case "npub":
      return npubEncode(result.data);
    case "note":
      return noteEncode(result.data);
  }
  return "";
}
function getEventPointerFromTag(tag) {
  if (!tag[1])
    throw new Error("Missing event id in tag");
  let pointer = { id: tag[1] };
  if (tag[2])
    pointer.relays = safeRelayUrls([tag[2]]);
  return pointer;
}
function getAddressPointerFromTag(tag) {
  if (!tag[1])
    throw new Error("Missing coordinate in tag");
  const pointer = parseCoordinate(tag[1], true, false);
  if (tag[2])
    pointer.relays = safeRelayUrls([tag[2]]);
  return pointer;
}
function getProfilePointerFromTag(tag) {
  if (!tag[1])
    throw new Error("Missing pubkey in tag");
  const pointer = { pubkey: tag[1] };
  if (tag[2])
    pointer.relays = safeRelayUrls([tag[2]]);
  return pointer;
}
function getPointerFromTag(tag) {
  try {
    switch (tag[0]) {
      case "e":
        return { type: "nevent", data: getEventPointerFromTag(tag) };
      case "a":
        return {
          type: "naddr",
          data: getAddressPointerFromTag(tag)
        };
      case "p":
        return { type: "nprofile", data: getProfilePointerFromTag(tag) };
    }
  } catch (error) {
  }
  return null;
}
function isAddressPointer(pointer) {
  return typeof pointer !== "string" && Object.hasOwn(pointer, "identifier") && Object.hasOwn(pointer, "pubkey") && Object.hasOwn(pointer, "kind");
}
function isEventPointer(pointer) {
  return typeof pointer !== "string" && Object.hasOwn(pointer, "id");
}
function getCoordinateFromAddressPointer(pointer) {
  return `${pointer.kind}:${pointer.pubkey}:${pointer.identifier}`;
}
function getATagFromAddressPointer(pointer) {
  var _a;
  const relay = (_a = pointer.relays) == null ? void 0 : _a[0];
  const coordinate = getCoordinateFromAddressPointer(pointer);
  return relay ? ["a", coordinate, relay] : ["a", coordinate];
}
function getETagFromEventPointer(pointer) {
  var _a;
  return ((_a = pointer.relays) == null ? void 0 : _a.length) ? ["e", pointer.id, pointer.relays[0]] : ["e", pointer.id];
}

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/helpers/threading.js
var Nip10ThreadRefsSymbol = Symbol.for("nip10-thread-refs");
function interpretThreadTags(event) {
  const eTags = event.tags.filter((t) => t[0] === "e" && t[1]);
  const aTags = event.tags.filter((t) => t[0] === "a" && t[1]);
  let rootETag = eTags.find((t) => t[3] === "root");
  let replyETag = eTags.find((t) => t[3] === "reply");
  let rootATag = aTags.find((t) => t[3] === "root");
  let replyATag = aTags.find((t) => t[3] === "reply");
  if (!rootETag || !replyETag) {
    rootETag = replyETag = rootETag || replyETag;
  }
  if (!rootATag || !replyATag) {
    rootATag = replyATag = rootATag || replyATag;
  }
  if (!rootETag && !replyETag) {
    const legacyETags = eTags.filter((t) => {
      if (t[3])
        return false;
      return true;
    });
    if (legacyETags.length >= 1) {
      rootETag = legacyETags[0];
      replyETag = legacyETags[legacyETags.length - 1] ?? rootETag;
    }
  }
  return {
    root: rootETag || rootATag ? { e: rootETag, a: rootATag } : void 0,
    reply: replyETag || replyATag ? { e: replyETag, a: replyATag } : void 0
  };
}
function getNip10References(event) {
  let refs = event[Nip10ThreadRefsSymbol];
  if (!refs) {
    const e = event;
    const tags = interpretThreadTags(e);
    refs = event[Nip10ThreadRefsSymbol] = {
      root: tags.root && {
        e: tags.root.e && getEventPointerFromTag(tags.root.e),
        a: tags.root.a && getAddressPointerFromTag(tags.root.a)
      },
      reply: tags.reply && {
        e: tags.reply.e && getEventPointerFromTag(tags.reply.e),
        a: tags.reply.a && getAddressPointerFromTag(tags.reply.a)
      }
    };
  }
  return refs;
}

export {
  INDEXABLE_TAGS,
  EventUIDSymbol,
  EventIndexableTagsSymbol,
  isReplaceable,
  getEventUID,
  getReplaceableUID,
  getIndexableTags,
  getTagValue,
  SeenRelaysSymbol,
  addSeenRelay,
  getSeenRelays,
  validateRelayURL,
  safeRelayUrl,
  safeRelayUrls,
  ProfileContentSymbol,
  getProfileContent,
  MailboxesInboxesSymbol,
  MailboxesOutboxesSymbol,
  getInboxes,
  getOutboxes,
  parseCoordinate,
  getPubkeyFromDecodeResult,
  encodeDecodeResult,
  getEventPointerFromTag,
  getAddressPointerFromTag,
  getProfilePointerFromTag,
  getPointerFromTag,
  isAddressPointer,
  isEventPointer,
  getCoordinateFromAddressPointer,
  getATagFromAddressPointer,
  getETagFromEventPointer,
  Nip10ThreadRefsSymbol,
  interpretThreadTags,
  getNip10References
};
//# sourceMappingURL=chunk-P6DIHSVM.js.map
