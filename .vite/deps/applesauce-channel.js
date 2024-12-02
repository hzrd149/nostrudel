import {
  kinds_exports
} from "./chunk-EMHHNKI2.js";
import "./chunk-PH3RM4HY.js";
import "./chunk-3QMXQ46N.js";
import "./chunk-43SEAG5C.js";
import "./chunk-UT7ZQG2B.js";
import "./chunk-WVX5ONCR.js";
import "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/applesauce-channel@0.7.0_typescript@5.6.2/node_modules/applesauce-channel/dist/helpers/channel.js
var ChannelMetadataSymbol = Symbol.for("channel-metadata");
function parseChannelMetadataContent(channel) {
  const metadata = JSON.parse(channel.content);
  if (metadata.name === void 0)
    throw new Error("Missing name");
  if (metadata.about === void 0)
    throw new Error("Missing about");
  if (metadata.picture === void 0)
    throw new Error("Missing picture");
  if (metadata.relays && !Array.isArray(metadata.relays))
    throw new Error("Invalid relays");
  return metadata;
}
function getChannelMetadataContent(channel) {
  let metadata = channel[ChannelMetadataSymbol];
  if (!metadata)
    metadata = channel[ChannelMetadataSymbol] = parseChannelMetadataContent(channel);
  return metadata;
}
function getChannelPointer(event) {
  const tag = event.tags.find((t) => t[0] === "e" && t[1]);
  if (!tag)
    return void 0;
  return tag[2] ? { id: tag[1], relays: [tag[2]] } : { id: tag[1] };
}

// node_modules/.pnpm/applesauce-channel@0.7.0_typescript@5.6.2/node_modules/applesauce-channel/dist/queries/channel.js
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return void 0;
  }
}
function ChannelMetadataQuery(channel) {
  return {
    key: channel.id,
    run: (events) => {
      const filters = [
        { ids: [channel.id] },
        { kinds: [kinds_exports.ChannelMetadata], "#e": [channel.id], authors: [channel.pubkey] }
      ];
      let latest = channel;
      return events.stream(filters).map((event) => {
        try {
          if (event.pubkey === latest.pubkey && event.created_at > latest.created_at) {
            latest = event;
          }
          return getChannelMetadataContent(latest);
        } catch (error) {
          return void 0;
        }
      });
    }
  };
}
function ChannelHiddenQuery(channel, authors = []) {
  return {
    key: channel.id,
    run: (events) => {
      const hidden = /* @__PURE__ */ new Map();
      return events.stream([{ kinds: [kinds_exports.ChannelHideMessage], "#e": [channel.id], authors: [channel.pubkey, ...authors] }]).map((event) => {
        var _a;
        const reason = (_a = safeParse(event.content)) == null ? void 0 : _a.reason;
        for (const tag of event.tags) {
          if (tag[0] === "e" && tag[1])
            hidden.set(tag[1], reason ?? "");
        }
        return hidden;
      });
    }
  };
}
function ChannelMutedQuery(channel, authors = []) {
  return {
    key: channel.id + authors.join(","),
    run: (events) => {
      const muted = /* @__PURE__ */ new Map();
      return events.stream([{ kinds: [kinds_exports.ChannelMuteUser], "#e": [channel.id], authors: [channel.pubkey, ...authors] }]).map((event) => {
        var _a;
        const reason = (_a = safeParse(event.content)) == null ? void 0 : _a.reason;
        for (const tag of event.tags) {
          if (tag[0] === "p" && tag[1])
            muted.set(tag[1], reason ?? "");
        }
        return muted;
      });
    }
  };
}
function ChannelMessagesQuery(channel) {
  return {
    key: channel.id,
    run: (events) => events.timeline([{ kinds: [kinds_exports.ChannelMessage], "#e": [channel.id] }])
  };
}
export {
  ChannelHiddenQuery,
  ChannelMessagesQuery,
  ChannelMetadataQuery,
  ChannelMetadataSymbol,
  ChannelMutedQuery,
  getChannelMetadataContent,
  getChannelPointer
};
//# sourceMappingURL=applesauce-channel.js.map
