import { AvatarGroup, Box, Flex, Heading, Image, Link, SimpleGrid, Text } from "@chakra-ui/react";
import { getEventUID, getProfilePointersFromList, getTagValue } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { NotesIcon, RelayIcon } from "../../components/icons";
import Server01 from "../../components/icons/server-01";
import Telescope from "../../components/icons/telescope";
import Upload01 from "../../components/icons/upload-01";
import SimpleNavBox from "../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../components/layout/presets/simple-view";
import UserAvatar from "../../components/user/user-avatar";
import { getEventCoordinate } from "../../helpers/nostr/event";
import { getListDescription, getListTitle } from "../../helpers/nostr/lists";
import useFavoriteLists from "../../hooks/use-favorite-lists";
import useRecentIds from "../../hooks/use-recent-ids";
import useUserSets from "../../hooks/use-user-sets";
import RouterLink from "../../components/router-link";

function ListFeed({ list, onUse }: { list: NostrEvent; onUse: () => void }) {
  const title = getListTitle(list);
  const description = getListDescription(list);
  const image = getTagValue(list, "image");
  const people = getProfilePointersFromList(list);

  return (
    <SimpleNavBox
      title={title}
      icon={image ? <Image src={image} alt={title} w="14" h="14" objectFit="cover" /> : undefined}
      to={`/?people=${getEventCoordinate(list)}`}
      description={description}
      metadata={
        <Flex gap="2" alignItems="center">
          <AvatarGroup size="sm">
            {people.slice(0, 5).map((person) => (
              <UserAvatar key={person.pubkey} pubkey={person.pubkey} size="xs" showNip05={false} />
            ))}
          </AvatarGroup>
          {people.length > 5 && <Text fontSize="sm">+{people.length - 5}</Text>}
        </Flex>
      }
      onClick={onUse}
    />
  );
}

export function BuiltInFeedCards() {
  const account = useActiveAccount();

  return (
    <>
      {account && (
        <>
          <SimpleNavBox
            icon={<NotesIcon boxSize={12} />}
            title="Notes"
            description="Browse notes posted by your contacts"
            to="/notes"
          />
          <SimpleNavBox
            icon={<Telescope boxSize={12} />}
            title="Blind spots"
            description="See what your friends are seeing that you are not"
            to="/feeds/blindspot"
          />
        </>
      )}
      <SimpleNavBox
        icon={<RelayIcon boxSize={12} />}
        title="Relays"
        description="Browser your favorite relays and find new ones"
        to="/feeds/relays"
      />
      {account && (
        <>
          <SimpleNavBox
            icon={<Upload01 boxSize={12} />}
            title="Outboxes"
            description="Browse the relays that your friends publish to"
            to="/feeds/outboxes"
          />
          <SimpleNavBox
            icon={<Server01 boxSize={12} />}
            title="DVM Feeds"
            description="Discover content through Decentralized Virtual Machines"
            to="/feeds/dvm"
          />
        </>
      )}
    </>
  );
}

export function ListFeedCards() {
  const account = useActiveAccount();
  const myLists = useUserSets(account?.pubkey)?.filter((list) => list.kind === kinds.Followsets) ?? [];
  const { lists: favoriteLists } = useFavoriteLists(account?.pubkey);

  const { recent: recentFeeds, useThing: useFeed } = useRecentIds("feeds", 4);

  const sortedFeeds = useMemo(() => {
    return [...myLists, ...favoriteLists].sort((a, b) => {
      const ai = recentFeeds.indexOf(getEventUID(a));
      const bi = recentFeeds.indexOf(getEventUID(b));
      const date = Math.sign(b.created_at - a.created_at);

      if (ai === -1 && bi === -1) return date;
      else if (bi === -1) return -1;
      else if (ai === -1) return 1;
      else return ai - bi;
    });
  }, [myLists, favoriteLists, recentFeeds]);

  return (
    <>
      {sortedFeeds.slice(0, 10).map((list) => (
        <ListFeed key={getEventUID(list)} list={list} onUse={() => useFeed(getEventUID(list))} />
      ))}
    </>
  );
}

function ListsSection() {
  return (
    <>
      <Box px="4" py="2">
        <Heading size="md">
          <Link as={RouterLink} to="/lists">
            Lists
          </Link>
        </Heading>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
        <ListFeedCards />
      </SimpleGrid>
    </>
  );
}

export default function FeedsHomeView() {
  const account = useActiveAccount();

  return (
    <SimpleView title="Feeds" flush>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }}>
        <BuiltInFeedCards />
      </SimpleGrid>
      {account && <ListsSection />}
    </SimpleView>
  );
}
