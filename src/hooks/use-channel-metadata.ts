import { useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { ChannelMetadataQuery } from "applesauce-core/queries";

import useSingleEvent from "./use-single-event";
import channelMetadataLoader from "../services/channel-metadata-loader";
import { useReadRelays } from "./use-client-relays";

export default function useChannelMetadata(
  channelId: string | undefined,
  additionalRelays?: string[],
  force?: boolean,
) {
  const relays = useReadRelays(additionalRelays);
  const channel = useSingleEvent(channelId);
  useMemo(() => {
    if (!channelId) return;
    return channelMetadataLoader.next({ value: channelId, relays, force });
  }, [channelId, relays.join("|"), force]);

  const metadata = useStoreQuery(ChannelMetadataQuery, channel && [channel]);

  return metadata;
}
