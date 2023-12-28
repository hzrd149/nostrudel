import {
  AvatarGroup,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  IconButton,
  LinkBox,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import useUserLists from "../../../hooks/use-user-lists";
import { NostrEvent } from "../../../types/nostr-event";
import { PEOPLE_LIST_KIND, getListName, getPubkeysFromList } from "../../../helpers/nostr/lists";
import UserAvatar from "../../../components/user-avatar";
import useCurrentAccount from "../../../hooks/use-current-account";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { getEventCoordinate, getEventUID } from "../../../helpers/nostr/events";
import Plus from "../../../components/icons/plus";
import useUserContactList from "../../../hooks/use-user-contact-list";

function Feed({ list, ...props }: { list: NostrEvent } & Omit<CardProps, "children">) {
  const people = getPubkeysFromList(list);

  return (
    <Card as={LinkBox} {...props}>
      <CardHeader p="4" fontWeight="bold">
        {getListName(list)}
      </CardHeader>
      <CardBody px="4" pt="0" pb="4" overflow="hidden" display="flex" gap="2" alignItems="center">
        <AvatarGroup>
          {people.slice(0, 6).map((person) => (
            <UserAvatar key={person.pubkey} pubkey={person.pubkey} />
          ))}
        </AvatarGroup>
        {people.length > 6 && <Text>+{people.length - 6}</Text>}
      </CardBody>
      <HoverLinkOverlay as={RouterLink} to={`/?people=${getEventCoordinate(list)}`} />
    </Card>
  );
}

export default function FeedsCard() {
  const account = useCurrentAccount();
  const contacts = useUserContactList();
  const lists = useUserLists(account?.pubkey).filter((list) => list.kind === PEOPLE_LIST_KIND);

  return (
    <Card as={LinkBox} variant="outline">
      <CardHeader display="flex" justifyContent="space-between">
        <Heading size="lg">Feeds</Heading>

        <IconButton
          as={RouterLink}
          to="/lists/browse"
          aria-label="View Lists"
          title="View Lists"
          icon={<Plus boxSize={5} />}
          size="sm"
        />
      </CardHeader>
      <CardBody overflowX="auto" overflowY="hidden" pt="0">
        <Flex gap="4">
          {contacts && <Feed list={contacts} w="xs" flexShrink={0} />}
          {lists.slice(0, 10).map((list) => (
            <Feed key={getEventUID(list)} list={list} w="xs" flexShrink={0} />
          ))}
        </Flex>
      </CardBody>
    </Card>
  );
}
