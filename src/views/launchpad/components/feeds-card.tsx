import {
  AvatarGroup,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Heading,
  IconButton,
  Link,
  LinkBox,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { kinds } from "nostr-tools";

import useUserSets from "../../../hooks/use-user-lists";
import { NostrEvent } from "nostr-tools";
import { getListTitle, getPubkeysFromList } from "../../../helpers/nostr/lists";
import UserAvatar from "../../../components/user/user-avatar";
import { useActiveAccount } from "applesauce-react/hooks";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { getEventCoordinate, getEventUID } from "../../../helpers/nostr/event";
import Plus from "../../../components/icons/plus";
import useUserContactList from "../../../hooks/use-user-contact-list";
import useRecentIds from "../../../hooks/use-recent-ids";
import useFavoriteLists from "../../../hooks/use-favorite-lists";

function Feed({ list, ...props }: { list: NostrEvent } & Omit<CardProps, "children">) {
  const people = getPubkeysFromList(list);

  return (
    <Card as={LinkBox} {...props}>
      <CardHeader p="4" fontWeight="bold">
        {getListTitle(list)}
      </CardHeader>
      <CardBody px="4" pt="0" pb="4" overflow="hidden" display="flex" gap="2" alignItems="center">
        <AvatarGroup>
          {people.slice(0, 5).map((person) => (
            <UserAvatar key={person.pubkey} pubkey={person.pubkey} />
          ))}
        </AvatarGroup>
        {people.length > 6 && <Text>+{people.length - 6}</Text>}
      </CardBody>
      <HoverLinkOverlay as={RouterLink} to={`/?people=${getEventCoordinate(list)}`} />
    </Card>
  );
}

export default function FeedsCard({ ...props }: Omit<CardProps, "children">) {
  const account = useActiveAccount();
  const contacts = useUserContactList(account?.pubkey);
  const myLists = useUserSets(account?.pubkey).filter((list) => list.kind === kinds.Followsets);
  const { lists: favoriteLists } = useFavoriteLists(account?.pubkey);

  const { recent: recentFeeds, useThing: useFeed } = useRecentIds("feeds", 4);

  const sortedFeeds = [...myLists, ...favoriteLists].sort((a, b) => {
    const ai = recentFeeds.indexOf(getEventUID(a));
    const bi = recentFeeds.indexOf(getEventUID(b));
    const date = Math.sign(b.created_at - a.created_at);

    if (ai === -1 && bi === -1) return date;
    else if (bi === -1) return -1;
    else if (ai === -1) return 1;
    else return ai - bi;
  });

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between">
        <Heading size="lg">
          <Link as={RouterLink} to="/lists">
            Feeds
          </Link>
        </Heading>

        <IconButton
          as={RouterLink}
          to="/lists/browse"
          aria-label="View Lists"
          title="View Lists"
          icon={<Plus boxSize={5} />}
          size="sm"
        />
      </CardHeader>
      <CardBody overflowX="auto" overflowY="hidden" pt="0" display="flex" gap="4">
        {contacts && <Feed list={contacts} w="17rem" flexShrink={0} />}
        {sortedFeeds.slice(0, 10).map((list) => (
          <Feed
            key={getEventUID(list)}
            list={list}
            w="17rem"
            flexShrink={0}
            onClick={() => useFeed(getEventUID(list))}
          />
        ))}
      </CardBody>
    </Card>
  );
}
