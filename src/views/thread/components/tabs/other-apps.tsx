import { Box, Flex, LinkBox, Text } from "@chakra-ui/react";
import { AppHandler as AppHandlerCast } from "applesauce-common/casts";
import { getAddressPointerForEvent, getEventPointerForEvent, isReplaceable } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { useCallback, useMemo } from "react";

import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import ArrowRight from "../../../../components/icons/arrow-right";
import { MetadataAvatar } from "../../../../components/user/user-avatar";
import { CAP_IS_WEB } from "../../../../env";
import useCastTimeline from "../../../../hooks/use-cast-timeline";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { useTimelineCurserIntersectionCallback } from "../../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import useUserContacts from "../../../../hooks/use-user-contacts";
import IntersectionObserverProvider from "../../../../providers/local/intersection-observer";
import { getEventRelayHints } from "../../../../services/relay-hints";

type AppWithLink = { app: AppHandlerCast; link: string };

function AppHandler({ app, link }: AppWithLink) {
  const ref = useEventIntersectionRef(app.event);

  return (
    <Flex as={LinkBox} gap="2" py="2" px="4" alignItems="center" ref={ref} overflow="hidden" shrink={0}>
      <MetadataAvatar metadata={app.metadata} />
      <Box overflow="hidden">
        <HoverLinkOverlay fontWeight="bold" href={link} isExternal>
          {app.name}
        </HoverLinkOverlay>
        <Text noOfLines={3}>{app.description}</Text>
      </Box>
      <ArrowRight boxSize={6} ml="auto" />
    </Flex>
  );
}

export default function OtherAppsTab({ event }: { event: NostrEvent }) {
  const account = useActiveAccount();
  const inboxes = useUserInbox(event.pubkey);
  const readRelays = useReadRelays(inboxes);

  const pointer = useMemo(() => {
    const relays = getEventRelayHints(event, 2);
    return isReplaceable(event.kind)
      ? getAddressPointerForEvent(event, relays)
      : getEventPointerForEvent(event, relays);
  }, [event]);

  const contacts = useUserContacts(CAP_IS_WEB ? account?.pubkey : undefined);
  const contactPubkeys = useMemo(() => contacts?.map((c) => c.pubkey), [contacts]);

  const appHandlerEventFilter = useCallback((e: NostrEvent) => e.content.length > 0, []);
  const appHandlerFilter = useMemo(() => {
    if (!contactPubkeys || contactPubkeys.length === 0) return undefined;
    return {
      kinds: [kinds.Handlerinformation],
      "#k": [String(event.kind)],
      authors: contactPubkeys,
    };
  }, [event.kind, contactPubkeys]);

  const { loader, timeline } = useTimelineLoader(`${event.kind}-app-handlers`, readRelays, appHandlerFilter, {
    eventFilter: appHandlerEventFilter,
  });
  const intersectionCallback = useTimelineCurserIntersectionCallback(loader);
  const appHandlers = useCastTimeline(timeline, AppHandlerCast);

  const apps = useMemo<AppWithLink[]>(() => {
    if (!pointer) return [];
    const seen = new Set<string>();
    return appHandlers.reduce<AppWithLink[]>((acc, app) => {
      if (seen.has(app.event.pubkey) || !app.metadata) return acc;
      const link = app.link(pointer, "web");
      if (!link) return acc;
      seen.add(app.event.pubkey);
      acc.push({ app, link });
      return acc;
    }, []);
  }, [appHandlers, pointer]);

  if (apps.length === 0) {
    return (
      <Text color="gray.500" px="4" py="2">
        No other apps found
      </Text>
    );
  }

  return (
    <Flex direction="column" gap="1">
      <IntersectionObserverProvider callback={intersectionCallback}>
        {apps.map(({ app, link }) => (
          <AppHandler key={app.id} app={app} link={link} />
        ))}
      </IntersectionObserverProvider>
    </Flex>
  );
}
