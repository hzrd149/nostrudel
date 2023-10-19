import { memo, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AvatarGroup,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  Link,
  LinkProps,
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
import { NoteLink } from "../../../components/note-link";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import ListFavoriteButton from "./list-favorite-button";
import { getEventUID } from "../../../helpers/nostr/events";
import ListMenu from "./list-menu";
import Timestamp from "../../../components/timestamp";
import { COMMUNITY_DEFINITION_KIND } from "../../../helpers/nostr/communities";
import { getArticleTitle } from "../../../helpers/nostr/long-form";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";

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
    <>
      <Text>
        Updated: <Timestamp timestamp={list.created_at} />
      </Text>
      {people.length > 0 && (
        <>
          <Text>People ({people.length}):</Text>
          <AvatarGroup overflow="hidden" mb="2" max={16} size="sm">
            {people.map(({ pubkey, relay }) => (
              <UserAvatarLink key={pubkey} pubkey={pubkey} relay={relay} />
            ))}
          </AvatarGroup>
        </>
      )}
      {notes.length > 0 && (
        <Flex gap="2" overflow="hidden" wrap="wrap">
          <Text>Notes ({notes.length}):</Text>
          {notes.slice(0, 4).map(({ id, relay }) => (
            <NoteLink key={id} noteId={id} />
          ))}
        </Flex>
      )}
      {references.length > 0 && (
        <Flex gap="2" overflow="hidden" wrap="wrap">
          <Text>References ({references.length})</Text>
          {references.slice(0, 3).map(({ url, petname }) => (
            <Link maxW="200" href={url} isExternal whiteSpace="pre" color="blue.500" isTruncated>
              {petname || url}
            </Link>
          ))}
        </Flex>
      )}
      {communities.length > 0 && (
        <Flex gap="2" overflow="hidden" wrap="wrap">
          <Text>Communities ({communities.length}):</Text>
          {communities.map((pointer) => (
            <Link
              key={JSON.stringify(pointer)}
              as={RouterLink}
              to={`/c/${pointer.identifier}/${nip19.npubEncode(pointer.pubkey)}`}
              color="blue.500"
            >
              {pointer.identifier}
            </Link>
          ))}
        </Flex>
      )}
      {articles.length > 0 && (
        <Flex overflow="hidden" direction="column" wrap="wrap">
          <Text>Articles ({articles.length}):</Text>
          {articles.slice(0, 4).map((pointer) => (
            <ArticleLinkLoader key={JSON.stringify(pointer)} pointer={pointer} isTruncated />
          ))}
        </Flex>
      )}
    </>
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
    <Card ref={ref} variant="outline" {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0">
        <Heading size="md" isTruncated>
          <Link as={RouterLink} to={`/lists/${link}`}>
            {getListName(list)}
          </Link>
        </Heading>
        {!hideCreator && (
          <>
            <Text>by</Text>
            <UserAvatarLink pubkey={list.pubkey} size="xs" />
            <UserLink pubkey={list.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
          </>
        )}
        <ButtonGroup size="xs" variant="ghost" ml="auto">
          <ListFavoriteButton list={list} />
          <ListMenu list={list} aria-label="list menu" />
        </ButtonGroup>
      </CardHeader>
      <CardBody p="2">
        <ListCardContent list={list} />
      </CardBody>
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
