import { memo, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Heading,
  Link,
  LinkBox,
  LinkProps,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Kind, nip19 } from "nostr-tools";

import UserAvatarLink from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import {
  getEventsFromList,
  getListName,
  getParsedCordsFromList,
  getPubkeysFromList,
  getReferencesFromList,
  isSpecialListKind,
} from "../../../helpers/nostr/lists";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { createCoordinate } from "../../../services/replaceable-event-requester";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import ListFavoriteButton from "./list-favorite-button";
import { getEventUID } from "../../../helpers/nostr/events";
import ListMenu from "./list-menu";
import { COMMUNITY_DEFINITION_KIND } from "../../../helpers/nostr/communities";
import { getArticleTitle } from "../../../helpers/nostr/long-form";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import { CommunityIcon, NotesIcon } from "../../../components/icons";
import User01 from "../../../components/icons/user-01";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import NoteZapButton from "../../../components/note/note-zap-button";
import Link01 from "../../../components/icons/link-01";
import File02 from "../../../components/icons/file-02";
import SimpleLikeButton from "../../../components/event-reactions/simple-like-button";

function ArticleLinkLoader({ pointer, ...props }: { pointer: nip19.AddressPointer } & Omit<LinkProps, "children">) {
  const article = useReplaceableEvent(pointer);
  if (article) return <ArticleLink article={article} {...props} />;
  return null;
}
function ArticleLink({ article, ...props }: { article: NostrEvent } & Omit<LinkProps, "children">) {
  const title = getArticleTitle(article);
  const naddr = getSharableEventAddress(article);

  return (
    <Link href={naddr ? buildAppSelectUrl(naddr, false) : undefined} isExternal color="blue.500" {...props}>
      {title}
    </Link>
  );
}

export function ListCardContent({ list, ...props }: Omit<CardProps, "children"> & { list: NostrEvent }) {
  const people = getPubkeysFromList(list);
  const notes = getEventsFromList(list);
  const coordinates = getParsedCordsFromList(list);
  const communities = coordinates.filter((cord) => cord.kind === COMMUNITY_DEFINITION_KIND);
  const articles = coordinates.filter((cord) => cord.kind === Kind.Article);
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
      {communities.length > 0 && (
        <Text>
          <CommunityIcon boxSize={5} /> {communities.length}
        </Text>
      )}
    </SimpleGrid>
  );
}

function ListCardRender({
  list,
  hideCreator = false,
  ...props
}: Omit<CardProps, "children"> & { list: NostrEvent; hideCreator?: boolean }) {
  const link = isSpecialListKind(list.kind) ? createCoordinate(list.kind, list.pubkey) : getSharableEventAddress(list);

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(list));

  return (
    <Card as={LinkBox} ref={ref} variant="outline" {...props}>
      <CardHeader display="flex" gap="2" p="4" alignItems="center">
        <Heading size="md" isTruncated>
          <HoverLinkOverlay as={RouterLink} to={`/lists/${link}`}>
            {getListName(list)}
          </HoverLinkOverlay>
        </Heading>
        {!hideCreator && (
          <>
            <Text>by</Text>
            <UserAvatarLink pubkey={list.pubkey} size="xs" />
            <UserLink pubkey={list.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
          </>
        )}
      </CardHeader>
      <CardBody py="0" px="4">
        <ListCardContent list={list} />
      </CardBody>
      <CardFooter p="2">
        <NoteZapButton event={list} size="sm" variant="ghost" />
        {/* TODO: reactions are tagging every user in list */}
        <SimpleLikeButton event={list} variant="ghost" size="sm" />
        <ButtonGroup size="sm" variant="ghost" ml="auto">
          <ListFavoriteButton list={list} />
          <ListMenu list={list} aria-label="list menu" />
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
}

function ListCard({
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

export default memo(ListCard);
