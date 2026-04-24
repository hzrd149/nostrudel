import { Box, Flex, LinkBox, Text } from "@chakra-ui/react";
import { ThreadItem } from "applesauce-common/models";
import { getProfileContent } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import ArrowRight from "../../../../components/icons/arrow-right";
import { MetadataAvatar } from "../../../../components/user/user-avatar";
import { getDisplayName } from "../../../../helpers/nostr/profile";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import IntersectionObserverProvider from "../../../../providers/local/intersection-observer";

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

export default function OtherAppsTab({
  post,
  apps,
  intersectionCallback,
}: {
  post: ThreadItem;
  apps: AppWithLink[];
  intersectionCallback: IntersectionObserverCallback;
}) {
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
