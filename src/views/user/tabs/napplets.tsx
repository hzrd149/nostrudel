import { SimpleGrid, Text } from "@chakra-ui/react";
import { useMemo } from "react";

import { ErrorBoundary } from "../../../components/error-boundary";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import LoadMoreButton from "../../../components/timeline/load-more-button";
import {
  NAPPLET_KIND_NAMED,
  NAPPLET_KIND_ROOT,
  getNappletNaddr,
  isValidNappletStoreEvent,
} from "../../../helpers/nostr/napplets";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { getInstalledNapplets } from "../../../services/installed-napplets";
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
  const callback = useTimelineCurserIntersectionCallback(loader);
  const installedAddresses = useMemo(() => new Set(getInstalledNapplets().map((napplet) => napplet.address)), []);

  return (
    <ScrollLayout maxW="6xl" center>
      <IntersectionObserverProvider callback={callback}>
        {napplets.length === 0 && <Text color="GrayText">No napplets found for this user.</Text>}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="4">
          {napplets.map((event) => {
            const address = getNappletNaddr(event);
            return (
              <ErrorBoundary key={event.id} event={event}>
                <NappletStoreCard
                  event={event}
                  installed={!!address && installedAddresses.has(address)}
                  showOpenButton
                />
              </ErrorBoundary>
            );
          })}
        </SimpleGrid>
        <LoadMoreButton loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
