import { Flex, List, ListItem, Spinner, Text } from "@chakra-ui/react";
import { AddressPointer } from "nostr-tools/nip19";
import FeedStatus from "./feed-status";

import GenericNoteTimeline from "../../../../components/timeline-page/generic-note-timeline";
import { ChainedDVMJob, getEventIdsFromJobs } from "../../../../helpers/nostr/dvm";
import useSingleEvents from "../../../../hooks/use-single-events";

function FeedEvents({ chain, relays }: { chain: ChainedDVMJob[]; relays?: string[] }) {
  const eventIds = getEventIdsFromJobs(chain);
  const events = useSingleEvents(eventIds, relays);

  return (
    <>
      <GenericNoteTimeline timeline={events} />

      {eventIds.length > 0 && events.length === 0 && (
        <Flex direction="column" mx="auto" mt="4" gap="4">
          <Flex fontWeight="bold" fontSize="lg" gap="2">
            <Spinner /> Loading events from relays...
          </Flex>

          <List>
            {relays?.map((relay) => (
              <ListItem key={relay}>{relay}</ListItem>
            ))}
          </List>
        </Flex>
      )}
    </>
  );
}

export default function Feed({ chain, pointer }: { chain: ChainedDVMJob[]; pointer: AddressPointer }) {
  return (
    <>
      {chain.length > 0 && <FeedEvents chain={chain} relays={pointer.relays} />}
      <FeedStatus chain={chain} pointer={pointer} />
    </>
  );
}
