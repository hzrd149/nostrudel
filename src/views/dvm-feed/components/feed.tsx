import { ChainedDVMJob, getEventIdsFromJobs } from "../../../helpers/nostr/dvm";
import FeedStatus from "./feed-status";
import { AddressPointer } from "nostr-tools/lib/types/nip19";
import useSingleEvents from "../../../hooks/use-single-events";
import GenericTimelineNote from "../../../components/timeline-page/generic-note-timeline/generic-timeline-note";

function FeedEvents({ chain }: { chain: ChainedDVMJob[] }) {
  const eventIds = getEventIdsFromJobs(chain);
  const events = useSingleEvents(eventIds);

  return (
    <>
      {events.map((event) => (
        <GenericTimelineNote event={event} visible />
      ))}
    </>
  );
}

export default function Feed({ chain, pointer }: { chain: ChainedDVMJob[]; pointer: AddressPointer }) {
  return (
    <>
      {chain.length > 0 && <FeedEvents chain={chain} />}
      <FeedStatus chain={chain} pointer={pointer} />
    </>
  );
}
