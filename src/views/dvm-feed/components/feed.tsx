import { useCallback } from "react";

import { ChainedDVMJob, getEventIdsFromJobs } from "../../../helpers/nostr/dvm";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { NostrEvent } from "../../../types/nostr-event";
import FeedStatus from "./feed-status";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import GenericNoteTimeline from "../../../components/timeline-page/generic-note-timeline";
import { AddressPointer } from "nostr-tools/lib/types/nip19";

function FeedEvents({ chain }: { chain: ChainedDVMJob[] }) {
  const eventIds = getEventIdsFromJobs(chain);
  const customSort = useCallback(
    (a: NostrEvent, b: NostrEvent) => {
      return eventIds.indexOf(a.id) - eventIds.indexOf(b.id);
    },
    [eventIds],
  );

  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(`${chain[0].request.id}-events`, readRelays, { ids: eventIds }, { customSort });

  return <GenericNoteTimeline timeline={timeline} />;
}

export default function Feed({ chain, pointer }: { chain: ChainedDVMJob[]; pointer: AddressPointer }) {
  return (
    <>
      {chain.length > 0 && <FeedEvents chain={chain} />}
      <FeedStatus chain={chain} pointer={pointer} />
    </>
  );
}
