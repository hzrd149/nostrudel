import {
  addRelayHintsToPointer,
  getEventPointerFromETag,
  getTagValue,
  isPTag,
  isSafeRelayURL,
  normalizeURL,
} from "applesauce-core/helpers";
import dayjs from "dayjs";
import { NostrEvent } from "nostr-tools";

export type StreamStatus = "live" | "ended" | "planned";

export function getStreamTitle(stream: NostrEvent) {
  return getTagValue(stream, "title");
}
export function getStreamSummary(stream: NostrEvent) {
  return getTagValue(stream, "summary");
}
export function getStreamImage(stream: NostrEvent) {
  return getTagValue(stream, "image");
}

export function getStreamStatus(stream: NostrEvent): StreamStatus {
  if (dayjs.unix(stream.created_at).isBefore(dayjs().subtract(2, "weeks"))) return "ended";
  else return (getTagValue(stream, "status") as StreamStatus) || "ended";
}

export function getStreamHost(stream: NostrEvent) {
  return stream.tags.filter(isPTag)[0]?.[1] ?? stream.pubkey;
}

export function getStreamGoalPointer(stream: NostrEvent) {
  const goalTag = stream.tags.find((t) => t[0] === "goal");
  return goalTag && addRelayHintsToPointer(getEventPointerFromETag(goalTag), getStreamRelays(stream));
}

/** Gets all the streaming urls for a stream */
export function getStreamStreamingURLs(stream: NostrEvent) {
  return stream.tags.filter((t) => t[0] === "streaming").map((t) => t[1]);
}

export function getStreamRecording(stream: NostrEvent) {
  return getTagValue(stream, "recording");
}

export function getStreamRelays(stream: NostrEvent) {
  let found = false;
  const relays: string[] = [];

  for (const tag of stream.tags) {
    if (tag[0] === "relays") {
      found = true;
      for (let i = 1; i < tag.length; i++) {
        if (!isSafeRelayURL(tag[i])) continue;

        const relay = normalizeURL(tag[i]);
        if (relay && !relays.includes(relay)) relays.push(relay);
      }
    }
  }

  return found ? relays : undefined;
}

/** Gets the stream start time if it has one */
export function getStreamStartTime(stream: NostrEvent) {
  const str = getTagValue(stream, "starts");
  return str ? parseInt(str) : undefined;
}

/** Gets the stream end time if it has one */
export function getStreamEndTime(stream: NostrEvent) {
  const str = getTagValue(stream, "ends");
  return str ? parseInt(str) : getStreamStatus(stream) === "ended" ? stream.created_at : undefined;
}

export function getStreamParticipants(stream: NostrEvent) {
  const current = getTagValue(stream, "current_participants");
  const total = getTagValue(stream, "total_participants");
  return {
    current: current ? parseInt(current) : undefined,
    total: total ? parseInt(total) : undefined,
  };
}

export function getStreamHashtags(stream: NostrEvent) {
  return stream.tags.filter((t) => t[0] === "t").map((t) => t[1]);
}
