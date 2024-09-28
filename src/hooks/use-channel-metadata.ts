import { useMemo } from "react";
import { Queries } from "applesauce-core";

import { RequestOptions } from "../services/replaceable-events";
import channelMetadataService from "../services/channel-metadata";
import useSingleEvent from "./use-single-event";
import { useStoreQuery } from "./use-store-query";

export default function useChannelMetadata(
  channelId: string | undefined,
  relays: Iterable<string> = [],
  opts: RequestOptions = {},
) {
  const channel = useSingleEvent(channelId);
  useMemo(() => {
    if (!channelId) return;
    return channelMetadataService.requestMetadata(relays, channelId, opts);
  }, [channelId, Array.from(relays).join("|"), opts?.alwaysRequest, opts?.ignoreCache]);

  const metadata = useStoreQuery(Queries.ChannelMetadataQuery, channel && [channel]);

  return metadata;
}
