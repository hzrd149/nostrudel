import { useEventModel } from "applesauce-react/hooks";
import { ChannelMetadataQuery } from "../models";
import { useReadRelays } from "./use-client-relays";
import { NostrEvent } from "nostr-tools";

export default function useChannelMetadata(channel: NostrEvent | undefined, additionalRelays?: string[]) {
  const relays = useReadRelays(additionalRelays);
  return useEventModel(ChannelMetadataQuery, channel ? [channel, relays] : undefined);
}
