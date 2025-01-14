import { useNavigate } from "react-router-dom";
import { kinds, nip19, NostrEvent } from "nostr-tools";
import type { DecodeResult } from "nostr-tools/nip19";
import { Box, Button, Flex, Heading, SimpleGrid, Spacer, Spinner, Text } from "@chakra-ui/react";
import { encodeDecodeResult } from "applesauce-core/helpers";
import { getAddressPointersFromList, getEventPointersFromList } from "applesauce-lists/helpers";

import UserLink from "../../../components/user/user-link";
import { ChevronLeftIcon } from "../../../components/icons";
import useCurrentAccount from "../../../hooks/use-current-account";
import { useDeleteEventContext } from "../../../providers/route/delete-event-provider";
import {
  getListDescription,
  getListName,
  getPubkeysFromList,
  getReferencesFromList,
  isSpecialListKind,
} from "../../../helpers/nostr/lists";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import UserCard from "../components/user-card";
import OpenGraphCard from "../../../components/open-graph/open-graph-card";
import { TrustProvider } from "../../../providers/local/trust-provider";
import ListMenu from "../components/list-menu";
import ListFavoriteButton from "../components/list-favorite-button";
import ListFeedButton from "../components/list-feed-button";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { EmbedEvent, EmbedEventPointer } from "../../../components/embed-event";
import useSingleEvent from "../../../hooks/use-single-event";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import useParamsAddressPointer from "../../../hooks/use-params-address-pointer";

function BookmarkedEvent({ id, relays }: { id: string; relays?: string[] }) {
  const event = useSingleEvent(id, relays);

  return event ? <EmbedEvent event={event} /> : <>Loading {id}</>;
}

function ListPage({ list }: { list: NostrEvent }) {
  const navigate = useNavigate();
  const { deleteEvent } = useDeleteEventContext();
  const account = useCurrentAccount();

  const description = getListDescription(list);
  const isAuthor = account?.pubkey === list.pubkey;
  const people = getPubkeysFromList(list);
  const notes = getEventPointersFromList(list);
  const coordinates = getAddressPointersFromList(list);
  const communities = coordinates.filter((cord) => cord.kind === kinds.CommunityDefinition);
  const articles = coordinates.filter((cord) => cord.kind === kinds.LongFormArticle);
  const references = getReferencesFromList(list);

  return (
    <TrustProvider trust>
      <VerticalPageLayout overflow="hidden" h="full">
        <Flex gap="2" alignItems="center">
          <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />}>
            Back
          </Button>

          <Spacer />

          <ListFavoriteButton list={list} />
          <ListFeedButton list={list} />
          {isAuthor && !isSpecialListKind(list.kind) && (
            <Button colorScheme="red" onClick={() => deleteEvent(list).then(() => navigate("/lists"))}>
              Delete
            </Button>
          )}
          <ListMenu aria-label="More options" list={list} />
        </Flex>

        <Box>
          <Heading size="lg" isTruncated>
            {getListName(list)}
          </Heading>
          <Text>
            Created by <UserAvatarLink pubkey={list.pubkey} size="xs" />{" "}
            <UserLink pubkey={list.pubkey} fontWeight="bold" />
          </Text>
          {description && <Text fontStyle="italic">{description}</Text>}
        </Box>

        {people.length > 0 && (
          <>
            <Heading size="lg">People</Heading>
            <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
              {people.map(({ pubkey, relay }) => (
                <UserCard key={pubkey} pubkey={pubkey} relay={relay} list={list} />
              ))}
            </SimpleGrid>
          </>
        )}

        {notes.length > 0 && (
          <>
            <Heading size="lg">Notes</Heading>
            <Flex gap="2" direction="column">
              {notes.map(({ id, relays }) => (
                <BookmarkedEvent key={id} id={id} relays={relays} />
              ))}
            </Flex>
          </>
        )}

        {references.length > 0 && (
          <>
            <Heading size="lg">References</Heading>
            <Flex gap="2" direction="column">
              {references.map(({ url, petname }) => (
                <>
                  {petname && <Heading size="md">{petname}</Heading>}
                  <OpenGraphCard url={new URL(url)} />
                </>
              ))}
            </Flex>
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
                return <EmbedEventPointer key={encodeDecodeResult(decode)} pointer={decode} />;
              })}
            </Flex>
          </>
        )}
      </VerticalPageLayout>
    </TrustProvider>
  );
}

export default function ListView() {
  const pointer = useParamsAddressPointer("addr", false);

  const list = useReplaceableEvent(pointer, [], true);

  if (!list)
    return (
      <>
        <Spinner /> Looking for list "{pointer.identifier}" created by <UserLink pubkey={pointer.pubkey} />
      </>
    );

  return <ListPage list={list} />;
}
