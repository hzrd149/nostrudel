import { Button, ButtonGroup, Divider, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { Outlet, Link as RouterLink, useLocation } from "react-router-dom";
import { Kind, nip19 } from "nostr-tools";

import {
  getCommunityRelays as getCommunityRelays,
  getCommunityImage,
  getCommunityName,
  COMMUNITY_APPROVAL_KIND,
} from "../../helpers/nostr/communities";
import { NostrEvent } from "../../types/nostr-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import UserAvatarLink from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import { AdditionalRelayProvider } from "../../providers/additional-relay-context";

import TrendUp01 from "../../components/icons/trend-up-01";
import Clock from "../../components/icons/clock";
import Hourglass03 from "../../components/icons/hourglass-03";
import VerticalCommunityDetails from "./components/vertical-community-details";
import { useBreakpointValue } from "../../providers/breakpoint-provider";
import HorizontalCommunityDetails from "./components/horizonal-community-details";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { getEventCoordinate, getEventUID } from "../../helpers/nostr/events";
import { WritingIcon } from "../../components/icons";
import { useContext } from "react";
import { PostModalContext } from "../../providers/post-modal-provider";
import CommunityEditModal from "./components/community-edit-modal";

function getCommunityPath(community: NostrEvent) {
  return `/c/${encodeURIComponent(getCommunityName(community))}/${nip19.npubEncode(community.pubkey)}`;
}

export default function CommunityHomePage({ community }: { community: NostrEvent }) {
  const image = getCommunityImage(community);
  const location = useLocation();
  const { openModal } = useContext(PostModalContext);
  const editModal = useDisclosure();
  const communityCoordinate = getEventCoordinate(community);

  const verticalLayout = useBreakpointValue({ base: true, xl: false });

  const communityRelays = getCommunityRelays(community);
  const readRelays = useReadRelayUrls(communityRelays);
  const timeline = useTimelineLoader(`${getEventUID(community)}-timeline`, readRelays, {
    kinds: [Kind.Text, Kind.Repost, COMMUNITY_APPROVAL_KIND],
    "#a": [communityCoordinate],
  });

  let active = "new";
  if (location.pathname.endsWith("/pending")) active = "pending";

  return (
    <>
      <AdditionalRelayProvider relays={communityRelays}>
        <VerticalPageLayout pt={image && "0"}>
          <Flex
            backgroundImage={getCommunityImage(community)}
            backgroundRepeat="no-repeat"
            backgroundSize="cover"
            backgroundPosition="center"
            aspectRatio={3 / 1}
            backgroundColor="rgba(0,0,0,0.2)"
            p="4"
            gap="4"
            direction="column"
            justifyContent="flex-end"
            textShadow="2px 2px var(--chakra-blur-sm) var(--chakra-colors-blackAlpha-800)"
          >
            <Heading>{getCommunityName(community)}</Heading>
            <Flex gap="2" alignItems="center">
              <UserAvatarLink pubkey={community.pubkey} size="sm" />
              <Text>by</Text>
              <UserLink pubkey={community.pubkey} />
            </Flex>
          </Flex>

          {verticalLayout && (
            <HorizontalCommunityDetails community={community} w="full" flexShrink={0} onEditClick={editModal.onOpen} />
          )}

          <Flex gap="4" alignItems="flex-start" overflow="hidden">
            <Flex direction="column" gap="4" flex={1} overflow="hidden">
              <ButtonGroup size="sm">
                <Button
                  colorScheme="primary"
                  leftIcon={<WritingIcon />}
                  onClick={() =>
                    openModal({
                      cacheFormKey: communityCoordinate + "-new-post",
                      initCommunity: communityCoordinate,
                      requireSubject: true,
                    })
                  }
                >
                  New Post
                </Button>
                <Divider orientation="vertical" h="2rem" />
                <Button leftIcon={<TrendUp01 />} isDisabled>
                  Trending
                </Button>
                <Button
                  leftIcon={<Clock />}
                  as={RouterLink}
                  to={getCommunityPath(community)}
                  replace
                  colorScheme={active === "new" ? "primary" : "gray"}
                >
                  New
                </Button>
                <Button
                  leftIcon={<Hourglass03 />}
                  as={RouterLink}
                  to={getCommunityPath(community) + "/pending"}
                  replace
                  colorScheme={active == "pending" ? "primary" : "gray"}
                >
                  Pending
                </Button>
              </ButtonGroup>

              <Outlet context={{ community, timeline }} />
            </Flex>

            {!verticalLayout && (
              <VerticalCommunityDetails
                community={community}
                w="full"
                maxW="xs"
                flexShrink={0}
                onEditClick={editModal.onOpen}
              />
            )}
          </Flex>
        </VerticalPageLayout>
      </AdditionalRelayProvider>
      {editModal.isOpen && (
        <CommunityEditModal isOpen={editModal.isOpen} onClose={editModal.onClose} community={community} />
      )}
    </>
  );
}
