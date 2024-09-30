import { useMemo } from "react";
import {
  Button,
  ButtonGroup,
  Center,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  Link,
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import dayjs from "dayjs";

import VerticalPageLayout from "../../components/vertical-page-layout";
import { ErrorBoundary } from "../../components/error-boundary";
import useUserCommunitiesList from "../../hooks/use-user-communities-list";
import useCurrentAccount from "../../hooks/use-current-account";
import CommunityCard from "./components/community-card";
import CommunityCreateModal, { FormValues } from "./components/community-create-modal";
import { DraftNostrEvent } from "../../types/nostr-event";
import {
  COMMUNITY_APPROVAL_KIND,
  COMMUNITY_DEFINITION_KIND,
  buildApprovalMap,
  getCommunityMods,
  getCommunityName,
} from "../../helpers/nostr/communities";
import { getImageSize } from "../../helpers/image";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import useUserMuteFilter from "../../hooks/use-user-mute-filter";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useReplaceableEvents from "../../hooks/use-replaceable-events";
import { getEventCoordinate, sortByDate } from "../../helpers/nostr/event";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import ApprovedEvent from "../community/components/community-approved-post";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { createCoordinate } from "../../classes/batch-kind-pubkey-loader";

function CommunitiesHomePage() {
  const publish = usePublishEvent();
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const createModal = useDisclosure();

  const readRelays = useReadRelays();
  const { pointers: communityCoordinates } = useUserCommunitiesList(account.pubkey, readRelays, {
    alwaysRequest: true,
  });
  const communities = useReplaceableEvents(communityCoordinates, readRelays).sort(sortByDate);

  const createCommunity = async (values: FormValues) => {
    const draft: DraftNostrEvent = {
      kind: COMMUNITY_DEFINITION_KIND,
      created_at: dayjs().unix(),
      content: "",
      tags: [["d", values.name]],
    };

    if (values.description) draft.tags.push(["description", values.description]);
    if (values.banner) {
      try {
        const size = await getImageSize(values.banner);
        draft.tags.push(["image", values.banner, `${size.width}x${size.height}`]);
      } catch (e) {
        draft.tags.push(["image", values.banner]);
      }
    }
    for (const pubkey of values.mods) draft.tags.push(["p", pubkey, "", "moderator"]);
    for (const url of values.relays) draft.tags.push(["relay", url]);
    for (const [url, name] of values.links) draft.tags.push(name ? ["r", url, name] : ["r", url]);
    // if (values.ranking) draft.tags.push(["rank_mode", values.ranking]);

    const pub = await publish("Create Community", draft, values.relays, false);

    if (pub) navigate(`/c/${getCommunityName(pub.event)}/${pub.event.pubkey}`);
  };

  const timeline = useTimelineLoader(
    `all-communities-timeline`,
    readRelays,
    communityCoordinates.length > 0
      ? {
          kinds: [kinds.ShortTextNote, kinds.Repost, kinds.GenericRepost, COMMUNITY_APPROVAL_KIND],
          "#a": communityCoordinates.map((p) => createCoordinate(p.kind, p.pubkey, p.identifier)),
        }
      : undefined,
  );

  const showUnapproved = useDisclosure();
  const muteFilter = useUserMuteFilter();
  const mods = useMemo(() => {
    const set = new Set<string>();
    for (const community of communities) {
      for (const pubkey of getCommunityMods(community)) {
        set.add(pubkey);
      }
    }
    return Array.from(set);
  }, [communities]);

  const events = useSubject(timeline.timeline);
  const approvalMap = buildApprovalMap(events, mods);

  const approved = events
    .filter((e) => e.kind !== COMMUNITY_APPROVAL_KIND && (showUnapproved.isOpen ? true : approvalMap.has(e.id)))
    .map((event) => ({ event, approvals: approvalMap.get(event.id) }))
    .filter((e) => !muteFilter(e.event));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  const communityDrawer = useDisclosure();

  return (
    <>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <Button as={RouterLink} to="/communities/explore">
            Explore
          </Button>

          <ButtonGroup ml="auto">
            <Button onClick={createModal.onOpen}>Create</Button>
            <Button onClick={communityDrawer.onOpen} hideFrom="xl">
              Joined
            </Button>
          </ButtonGroup>
        </Flex>
        {communities.length > 0 ? (
          <Flex gap="4" overflow="hidden">
            <Flex direction="column" gap="2" flex={1} overflow="hidden">
              <Flex alignItems="center" gap="4">
                <Heading size="lg">Latest Posts</Heading>
                <Switch isChecked={showUnapproved.isOpen} onChange={showUnapproved.onToggle}>
                  Show Unapproved
                </Switch>
              </Flex>
              <IntersectionObserverProvider callback={callback}>
                {approved.map(({ event, approvals }) => (
                  <ApprovedEvent key={event.id} event={event} approvals={approvals ?? []} showCommunity />
                ))}
              </IntersectionObserverProvider>
              <TimelineActionAndStatus timeline={timeline} />
            </Flex>
            <Flex gap="2" direction="column" w="md" flexShrink={0} hideBelow="xl">
              <Heading size="md">Joined Communities</Heading>
              {communities.map((community) => (
                <ErrorBoundary key={getEventCoordinate(community)} event={community}>
                  <CommunityCard community={community} />
                </ErrorBoundary>
              ))}
            </Flex>
          </Flex>
        ) : (
          <Center py="20" flexDirection="column" gap="4">
            <Heading size="md">No communities :(</Heading>
            <Text>
              go find a cool one to join.{" "}
              <Link as={RouterLink} to="/communities/explore" color="blue.500">
                Explore
              </Link>
            </Text>
          </Center>
        )}
      </VerticalPageLayout>
      {createModal.isOpen && (
        <CommunityCreateModal isOpen={createModal.isOpen} onClose={createModal.onClose} onSubmit={createCommunity} />
      )}

      <Drawer isOpen={communityDrawer.isOpen} placement="right" onClose={communityDrawer.onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader p="4">Joined Communities</DrawerHeader>

          <DrawerBody display="flex" flexDirection="column" gap="2" px="4" pt="0" pb="8" overflowY="auto">
            {communities.map((community) => (
              <ErrorBoundary key={getEventCoordinate(community)} event={community}>
                <CommunityCard community={community} flexShrink={0} />
              </ErrorBoundary>
            ))}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default function CommunitiesHomeView() {
  const account = useCurrentAccount();
  return account ? <CommunitiesHomePage /> : <Navigate to="/communities/explore" />;
}
