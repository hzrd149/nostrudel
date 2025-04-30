import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  LinkBox,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import {
  getAddressPointersFromList,
  getEventPointersFromList,
  getProfilePointersFromList,
  getReplaceableUID,
} from "applesauce-core/helpers";

import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import {
  getListDescription,
  getListTitle,
  getReferencesFromList,
  isSpecialListKind,
} from "../../../helpers/nostr/lists";
import { NostrEvent } from "nostr-tools";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import ListFavoriteButton from "./list-favorite-button";
import ListMenu from "./list-menu";
import { NotesIcon } from "../../../components/icons";
import User01 from "../../../components/icons/user-01";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import EventZapButton from "../../../components/zap/event-zap-button";
import Link01 from "../../../components/icons/link-01";
import File02 from "../../../components/icons/file-02";
import SimpleLikeButton from "../../../components/event-reactions/simple-like-button";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { getSharableEventAddress } from "../../../services/relay-hints";
import Timestamp from "../../../components/timestamp";

export function ListCardContent({ list }: { list: NostrEvent }) {
  const people = getProfilePointersFromList(list);
  const notes = getEventPointersFromList(list);
  const coordinates = getAddressPointersFromList(list);
  const articles = coordinates.filter((cord) => cord.kind === kinds.LongFormArticle);
  const references = getReferencesFromList(list);

  return (
    <SimpleGrid spacing="2" columns={4}>
      {people.length > 0 && (
        <Text>
          <User01 boxSize={5} /> {people.length}
        </Text>
      )}
      {notes.length > 0 && (
        <Text>
          <NotesIcon boxSize={5} /> {notes.length}
        </Text>
      )}
      {references.length > 0 && (
        <Text>
          <Link01 boxSize={5} /> {references.length}
        </Text>
      )}
      {articles.length > 0 && (
        <Text>
          <File02 /> {articles.length}
        </Text>
      )}
    </SimpleGrid>
  );
}

export function createListLink(list: NostrEvent) {
  const isSpecialList = isSpecialListKind(list.kind);
  return "/lists/" + (isSpecialList ? getReplaceableUID(list.kind, list.pubkey) : getSharableEventAddress(list));
}

function ListCardRender({
  list,
  hideCreator = false,
  ...props
}: Omit<CardProps, "children"> & { list: NostrEvent; hideCreator?: boolean }) {
  const isSpecialList = isSpecialListKind(list.kind);

  // if there is a parent intersection observer, register this card
  const ref = useEventIntersectionRef(list);

  const description = getListDescription(list);

  return (
    <Card as={LinkBox} ref={ref} {...props}>
      <CardHeader p="4">
        <Flex gap="2" alignItems="center">
          <Heading size="md" isTruncated>
            <HoverLinkOverlay as={RouterLink} to={createListLink(list)}>
              {getListTitle(list)}
            </HoverLinkOverlay>
          </Heading>
          {!hideCreator && (
            <>
              <Text>by</Text>
              <UserAvatarLink pubkey={list.pubkey} size="xs" />
              <UserLink pubkey={list.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
            </>
          )}
        </Flex>
        {description && <Text fontStyle="italic">{description}</Text>}
      </CardHeader>
      <CardBody py="0" px="4">
        <ListCardContent list={list} />
      </CardBody>
      <CardFooter p="2">
        <Text>
          updated <Timestamp timestamp={list.created_at} />
        </Text>
        <ButtonGroup size="sm" variant="ghost" ml="auto" zIndex="1">
          <ListFavoriteButton list={list} />
          <ListMenu list={list} aria-label="list menu" />
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
}

/** @deprecated build new list cards instead of using this */
export default function FallbackListCard({
  cord,
  list: maybeEvent,
  hideCreator,
}: {
  cord?: string;
  list?: NostrEvent;
  hideCreator?: boolean;
}) {
  const event = maybeEvent ?? (cord ? useReplaceableEvent(cord as string) : undefined);
  if (!event) return null;
  else return <ListCardRender list={event} hideCreator={hideCreator} />;
}
