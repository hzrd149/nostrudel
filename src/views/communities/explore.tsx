import { useMemo } from "react";
import { AvatarGroup, Button, Flex, SimpleGrid, Switch, useDisclosure } from "@chakra-ui/react";

import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { PointerCommunityCard } from "./components/community-card";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { COMMUNITY_DEFINITION_KIND } from "../../helpers/nostr/communities";
import { ErrorBoundary } from "../../components/error-boundary";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubjects from "../../hooks/use-subjects";
import replaceableEventLoaderService from "../../services/replaceable-event-requester";
import { COMMUNITIES_LIST_KIND, getCoordinatesFromList } from "../../helpers/nostr/lists";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "../../components/icons";
import { parseCoordinate } from "../../helpers/nostr/events";
import UserAvatarLink from "../../components/user-avatar-link";
import { AddressPointer } from "nostr-tools/lib/types/nip19";

export function useUsersJoinedCommunitiesLists(pubkeys: string[], additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const communityListsSubjects = useMemo(() => {
    return pubkeys.map((pubkey) =>
      replaceableEventLoaderService.requestEvent(readRelays, COMMUNITIES_LIST_KIND, pubkey),
    );
  }, [pubkeys]);
  return useSubjects(communityListsSubjects);
}

function CommunityCardWithMembers({ pointer, pubkeys }: { pointer: AddressPointer; pubkeys: string[] }) {
  return (
    <ErrorBoundary>
      <Flex direction="column" gap="2">
        <AvatarGroup size="md">
          {pubkeys.map((pubkey) => (
            <UserAvatarLink key={pubkey} pubkey={pubkey} />
          ))}
        </AvatarGroup>
        <PointerCommunityCard pointer={pointer} maxW="xl" />
      </Flex>
    </ErrorBoundary>
  );
}

function CommunitiesExplorePage() {
  const navigate = useNavigate();
  const { people } = usePeopleListContext();
  const showMore = useDisclosure();

  const communitiesLists = useUsersJoinedCommunitiesLists(people?.map((p) => p.pubkey) ?? []);

  const communityPointers = useMemo(() => {
    const dir = new Map<string, { pointer: AddressPointer; pubkeys: string[] }>();
    for (const list of communitiesLists) {
      for (const { coordinate } of getCoordinatesFromList(list)) {
        const pointer = parseCoordinate(coordinate, true);
        if (!pointer) continue;
        if (pointer.kind === COMMUNITY_DEFINITION_KIND) {
          if (dir.has(coordinate)) {
            dir.get(coordinate)?.pubkeys.push(list.pubkey);
          } else dir.set(coordinate, { pointer, pubkeys: [list.pubkey] });
        }
      }
    }
    return dir;
  }, [communitiesLists]);

  const sorted = Array.from(communityPointers.values()).sort((a, b) => b.pubkeys.length - a.pubkeys.length);

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />}>
          Back
        </Button>
        <PeopleListSelection hideGlobalOption />
        <Switch onChange={showMore.onToggle} checked={showMore.isOpen}>
          Show More
        </Switch>
      </Flex>
      <SimpleGrid spacing="4" columns={{ base: 1, lg: 2 }}>
        {sorted
          .filter((c) => (showMore ? c.pubkeys.length > 1 : true))
          .map(({ pointer, pubkeys }) => (
            <CommunityCardWithMembers
              key={pointer.kind + pointer.pubkey + pointer.identifier}
              pointer={pointer}
              pubkeys={pubkeys}
            />
          ))}
      </SimpleGrid>
    </VerticalPageLayout>
  );
}

export default function ExploreCommunitiesView() {
  return (
    <PeopleListProvider>
      <CommunitiesExplorePage />
    </PeopleListProvider>
  );
}
