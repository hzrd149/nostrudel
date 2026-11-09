import { Box, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";

import { ErrorBoundary } from "../../../components/error-boundary";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import { NAPPLET_KIND_NAMED, NAPPLET_KIND_ROOT, isValidNappletStoreEvent } from "../../../helpers/nostr/napplets";
import useNappletEngagement from "../../../hooks/use-napplet-engagement";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useInfiniteNappletTimeline from "../../../hooks/use-infinite-napplet-timeline";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import NappletStoreCard from "../../napplets/components/napplet-store-card";

export default function UserNappletsTab() {
  const user = useParamsProfilePointer("pubkey");
  const relays = useUserOutbox(user) || [];

  const { loader, timeline: napplets } = useTimelineLoader(
    `${user.pubkey}-napplets`,
    relays,
    { authors: [user.pubkey], kinds: [NAPPLET_KIND_ROOT, NAPPLET_KIND_NAMED] },
    { eventFilter: isValidNappletStoreEvent },
  );
  const { end, loading, error } = useInfiniteNappletTimeline(loader);
  const engagement = useNappletEngagement(napplets, relays);

  return (
    <ScrollLayout maxW="6xl" center>
      {!loading && napplets.length === 0 && <Text color="GrayText">No napplets found for this user.</Text>}
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="1">
        {napplets.map((event) => (
          <ErrorBoundary key={event.id} event={event}>
            <NappletStoreCard event={event} engagement={engagement.get(getEventUID(event))} showAuthor={false} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
      {loading && <Spinner />}
      {error && <Text role="alert">{error}</Text>}
      <Box ref={end} minH="1px" aria-hidden />
    </ScrollLayout>
  );
}
