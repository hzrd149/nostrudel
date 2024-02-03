import { useMemo } from "react";

import { RequestOptions } from "../services/replaceable-event-requester";
import useSubject from "./use-subject";
import channelMetadataService from "../services/channel-metadata";
import { ChannelMetadata, safeParseChannelMetadata } from "../helpers/nostr/channel";
import useSingleEvent from "./use-single-event";

export default function useChannelMetadata(
  channelId: string | undefined,
  relays: Iterable<string> = [],
  opts: RequestOptions = {},
) {
  const channel = useSingleEvent(channelId);
  const sub = useMemo(() => {
    if (!channelId) return;
    return channelMetadataService.requestMetadata(relays, channelId, opts);
  }, [channelId, Array.from(relays).join("|"), opts?.alwaysRequest, opts?.ignoreCache]);

  const event = useSubject(sub);
  const baseMetadata = useMemo(() => channel && safeParseChannelMetadata(channel), [channel]);
  const newMetadata = useMemo(() => event && safeParseChannelMetadata(event), [event]);

  const metadata = useMemo(() => ({ ...baseMetadata, ...newMetadata }) as ChannelMetadata, [baseMetadata, newMetadata]);

  return { metadata, event };
}
