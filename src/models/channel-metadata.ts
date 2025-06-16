import { Model } from "applesauce-core";
import { ChannelMetadataContent } from "applesauce-core/helpers";
import { ChannelMetadataModel } from "applesauce-core/models";
import { defer, ignoreElements, mergeWith } from "rxjs";
import { channelMetadataLoader } from "../services/loaders";
import { NostrEvent } from "nostr-tools";

export function ChannelMetadataQuery(
  channel: NostrEvent,
  relays?: string[],
): Model<ChannelMetadataContent | undefined> {
  return (events) =>
    defer(() => channelMetadataLoader({ value: channel.id, relays })).pipe(
      ignoreElements(),
      mergeWith(events.model(ChannelMetadataModel, channel)),
    );
}
