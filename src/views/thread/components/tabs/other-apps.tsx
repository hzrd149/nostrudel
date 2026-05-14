import { Box, Flex, LinkBox, Text } from "@chakra-ui/react";
import { getProfileContent, isReplaceable } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { useCallback, useMemo } from "react";

import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import ArrowRight from "../../../../components/icons/arrow-right";
import { MetadataAvatar } from "../../../../components/user/user-avatar";
import { CAP_IS_WEB } from "../../../../env";
import { getDisplayName } from "../../../../helpers/nostr/profile";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { useTimelineCurserIntersectionCallback } from "../../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import useUserContacts from "../../../../hooks/use-user-contacts";
import IntersectionObserverProvider from "../../../../providers/local/intersection-observer";
import { getSharableEventAddress } from "../../../../services/relay-hints";

export type AppWithLink = { app: NostrEvent; link: string };

function AppHandler({ app, link }: AppWithLink) {
  const metadata = useMemo(() => getProfileContent(app), [app]);
  const ref = useEventIntersectionRef(app);

  return (
    <Flex as={LinkBox} gap="2" py="2" px="4" alignItems="center" ref={ref} overflow="hidden" shrink={0}>
      <MetadataAvatar metadata={metadata} />
      <Box overflow="hidden">
        <HoverLinkOverlay fontWeight="bold" href={link} isExternal>
          {getDisplayName(metadata, app.pubkey)}
        </HoverLinkOverlay>
        <Text noOfLines={3}>{metadata?.about}</Text>
      </Box>
      <ArrowRight boxSize={6} ml="auto" />
    </Flex>
  );
}

export default function OtherAppsTab({ event }: { event: NostrEvent }) {
  const account = useActiveAccount();
  const inboxes = useUserInbox(event.pubkey);
  const readRelays = useReadRelays(inboxes);

  const sharableAddress = useMemo(() => getSharableEventAddress(event), [event]);
  const addressType = isReplaceable(event.kind) ? "naddr" : "nevent";

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

  const { loader, timeline: appHandlers } = useTimelineLoader(
    `${event.kind}-app-handlers`,
    readRelays,
    appHandlerFilter,
    { eventFilter: appHandlerEventFilter },
  );
  const intersectionCallback = useTimelineCurserIntersectionCallback(loader);

  const apps = useMemo<AppWithLink[]>(() => {
    if (!sharableAddress) return [];
    const seen = new Set<string>();
    return appHandlers.reduce<AppWithLink[]>((acc, app) => {
      if (seen.has(app.pubkey)) return acc;
      try {
        getProfileContent(app);
      } catch {
        return acc;
      }
      const tag = app.tags.find((t) => t[0] === "web" && t[2] === addressType) || app.tags.find((t) => t[0] === "web");
      if (!tag || !tag[1]) return acc;
      seen.add(app.pubkey);
      acc.push({ app, link: tag[1].replace("<bech32>", sharableAddress) });
      return acc;
    }, []);
  }, [appHandlers, sharableAddress, addressType]);

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
