import { useNavigate, useParams } from "react-router-dom";
import { Kind, nip19 } from "nostr-tools";

import { UserLink } from "../../components/user-link";
import { Button, Flex, Heading, SimpleGrid, Spacer } from "@chakra-ui/react";
import { ArrowLeftSIcon } from "../../components/icons";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useDeleteEventContext } from "../../providers/delete-event-provider";
import { parseCoordinate } from "../../helpers/nostr/events";
import {
  getEventsFromList,
  getListName,
  getParsedCordsFromList,
  getPubkeysFromList,
  getReferencesFromList,
  isSpecialListKind,
} from "../../helpers/nostr/lists";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import UserCard from "./components/user-card";
import OpenGraphCard from "../../components/open-graph-card";
import NoteCard from "./components/note-card";
import { TrustProvider } from "../../providers/trust";
import ListMenu from "./components/list-menu";
import ListFavoriteButton from "./components/list-favorite-button";
import ListFeedButton from "./components/list-feed-button";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { COMMUNITY_DEFINITION_KIND } from "../../helpers/nostr/communities";
import { EmbedEventPointer } from "../../components/embed-event";
import { encodePointer } from "../../helpers/nip19";
import { DecodeResult } from "nostr-tools/lib/nip19";

function useListCoordinate() {
  const { addr } = useParams() as { addr: string };

  if (addr.includes(":")) {
    const parsed = parseCoordinate(addr);
    if (!parsed) throw new Error("Bad coordinate");
    return parsed;
  }

  const parsed = nip19.decode(addr);
  if (parsed.type !== "naddr") throw new Error(`Unknown type ${parsed.type}`);
  return parsed.data;
}

export default function ListDetailsView() {
  const navigate = useNavigate();
  const coordinate = useListCoordinate();
  const { deleteEvent } = useDeleteEventContext();
  const account = useCurrentAccount();

  const list = useReplaceableEvent(coordinate, [], { alwaysRequest: true });

  if (!list)
    return (
      <>
        Looking for list "{coordinate.identifier}" created by <UserLink pubkey={coordinate.pubkey} />
      </>
    );

  const isAuthor = account?.pubkey === list.pubkey;
  const people = getPubkeysFromList(list);
  const notes = getEventsFromList(list);
  const coordinates = getParsedCordsFromList(list);
  const communities = coordinates.filter((cord) => cord.kind === COMMUNITY_DEFINITION_KIND);
  const articles = coordinates.filter((cord) => cord.kind === Kind.Article);
  const references = getReferencesFromList(list);

  return (
    <VerticalPageLayout overflow="hidden" h="full">
      <Flex gap="2" alignItems="center">
        <Button onClick={() => navigate(-1)} leftIcon={<ArrowLeftSIcon />}>
          Back
        </Button>

        <Heading size="md" isTruncated>
          {getListName(list)}
        </Heading>
        <ListFavoriteButton list={list} size="sm" />

        <Spacer />

        <ListFeedButton list={list} />
        {isAuthor && !isSpecialListKind(list.kind) && (
          <Button colorScheme="red" onClick={() => deleteEvent(list).then(() => navigate("/lists"))}>
            Delete
          </Button>
        )}
        <ListMenu aria-label="More options" list={list} />
      </Flex>

      {people.length > 0 && (
        <>
          <Heading size="lg">People</Heading>
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
            {people.map(({ pubkey, relay }) => (
              <UserCard pubkey={pubkey} relay={relay} list={list} />
            ))}
          </SimpleGrid>
        </>
      )}

      {notes.length > 0 && (
        <>
          <Heading size="lg">Notes</Heading>
          <TrustProvider trust>
            <Flex gap="2" direction="column">
              {notes.map(({ id, relay }) => (
                <NoteCard id={id} relay={relay} />
              ))}
            </Flex>
          </TrustProvider>
        </>
      )}

      {references.length > 0 && (
        <>
          <Heading size="lg">References</Heading>
          <TrustProvider trust>
            <Flex gap="2" direction="column">
              {references.map(({ url, petname }) => (
                <>
                  {petname && <Heading size="md">{petname}</Heading>}
                  <OpenGraphCard url={new URL(url)} />
                </>
              ))}
            </Flex>
          </TrustProvider>
        </>
      )}

      {communities.length > 0 && (
        <>
          <Heading size="lg">Communities</Heading>
          <SimpleGrid spacing="2" columns={{ base: 1, lg: 2 }}>
            {communities.map((pointer) => (
              <EmbedEventPointer key={nip19.naddrEncode(pointer)} pointer={{ type: "naddr", data: pointer }} />
            ))}
          </SimpleGrid>
        </>
      )}

      {articles.length > 0 && (
        <>
          <Heading size="lg">Articles</Heading>
          <Flex gap="2" direction="column">
            {articles.map((pointer) => {
              const decode: DecodeResult = { type: "naddr", data: pointer };
              return <EmbedEventPointer key={encodePointer(decode)} pointer={decode} />;
            })}
          </Flex>
        </>
      )}
    </VerticalPageLayout>
  );
}
