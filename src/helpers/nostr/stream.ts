import dayjs from "dayjs";
import { DraftNostrEvent, NostrEvent, isPTag } from "../../types/nostr-event";
import { unique } from "../array";
import { ensureNotifyContentMentions } from "./post";
import { getEventCoordinate } from "./event";

export const STREAM_KIND = 30311;
export const STREAM_CHAT_MESSAGE_KIND = 1311;

export type ParsedStream = {
  event: NostrEvent;
  author: string;
  host: string;
  title?: string;
  summary?: string;
  image?: string;
  updated: number;
  status: "live" | "ended" | string;
  goal?: string;
  starts?: number;
  ends?: number;
  identifier: string;
  tags: string[];
  streaming?: string;
  recording?: string;
  relays?: string[];
};

export function getStreamHost(stream: NostrEvent) {
  return stream.tags.filter(isPTag)[0]?.[1] ?? stream.pubkey;
}

export function parseStreamEvent(stream: NostrEvent): ParsedStream {
  const title = stream.tags.find((t) => t[0] === "title")?.[1];
  const summary = stream.tags.find((t) => t[0] === "summary")?.[1];
  const image = stream.tags.find((t) => t[0] === "image")?.[1];
  const starts = stream.tags.find((t) => t[0] === "starts")?.[1];
  const ends = stream.tags.find((t) => t[0] === "ends")?.[1];
  const streaming = stream.tags.find((t) => t[0] === "streaming")?.[1];
  const recording = stream.tags.find((t) => t[0] === "recording")?.[1];
  const goal = stream.tags.find((t) => t[0] === "goal")?.[1];
  const identifier = stream.tags.find((t) => t[0] === "d")?.[1];

  if (!identifier) throw new Error("Missing Identifier");

  let relays = stream.tags.find((t) => t[0] === "relays");
  // remove the first "relays" element
  if (relays) {
    relays = Array.from(relays);
    relays.shift();
  }

  const startTime = starts ? parseInt(starts) : undefined;
  let endTime = ends ? parseInt(ends) : undefined;

  let status = stream.tags.find((t) => t[0] === "status")?.[1] || "ended";
  if (status === "ended" && endTime === undefined) endTime = stream.created_at;
  if (endTime && endTime > dayjs().unix()) {
    status = "ended";
  }

  // if the stream has not been updated in a day consider it ended
  if (stream.created_at < dayjs().subtract(1, "week").unix()) {
    status = "ended";
  }

  const tags = unique(stream.tags.filter((t) => t[0] === "t" && t[1]).map((t) => t[1] as string));

  return {
    author: stream.pubkey,
    host: getStreamHost(stream),
    event: stream,
    updated: stream.created_at,
    streaming,
    recording,
    tags,
    title,
    summary,
    image,
    status,
    starts: startTime,
    ends: endTime,
    goal,
    identifier,
    relays,
  };
}

export function getATag(stream: ParsedStream) {
  return getEventCoordinate(stream.event);
}

export function buildChatMessage(stream: ParsedStream, content: string) {
  let draft: DraftNostrEvent = {
    tags: [["a", getATag(stream), "", "root"]],
    content,
    created_at: dayjs().unix(),
    kind: STREAM_CHAT_MESSAGE_KIND,
  };

  draft = ensureNotifyContentMentions(draft);

  return draft;
}
