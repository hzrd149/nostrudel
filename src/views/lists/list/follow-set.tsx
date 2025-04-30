import {
  Box,
  Button,
  ButtonGroup,
  ButtonProps,
  Card,
  Flex,
  Heading,
  IconButton,
  SimpleGrid,
  useDisclosure,
} from "@chakra-ui/react";
import { RemoveUserFromFollowSet } from "applesauce-actions/actions";
import { getProfilePointersFromList, getReplaceableAddress, getTagValue } from "applesauce-core/helpers";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import GenericCommentForm from "../../../components/comment/generic-comment-form";
import { GenericComments } from "../../../components/comment/generic-comments";
import { ErrorBoundary } from "../../../components/error-boundary";
import { TrashIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import EventQuoteButton from "../../../components/note/event-quote-button";
import NoteReactions from "../../../components/note/timeline-note/components/note-reactions";
import UserAboutContent from "../../../components/user/user-about-content";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import { SimpleUserFollowButton } from "../../../components/user/user-follow-button";
import UserLink from "../../../components/user/user-link";
import EventZapButton from "../../../components/zap/event-zap-button";
import { getListDescription, getListTitle } from "../../../helpers/nostr/lists";
import useAsyncAction from "../../../hooks/use-async-action";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import ListMenu from "../components/list-menu";
import GenericCommentSection from "../../../components/comment/generic-comment-section";
import RouterLink from "../../../components/router-link";
import { ListPageHeader } from ".";
import ListEditModal from "../components/list-edit-modal";

function ListFeedButton({ list, ...props }: { list: NostrEvent } & Omit<ButtonProps, "children">) {
  return (
    <Button
      as={RouterLink}
      to={{ pathname: "/", search: new URLSearchParams({ people: getReplaceableAddress(list) }).toString() }}
      {...props}
    >
      View Feed
    </Button>
  );
}

function UserCard({ pubkey, list }: { pubkey: string; list: NostrEvent }) {
  const hub = useActionHub();
  const publish = usePublishEvent();

  const remove = useAsyncAction(async () => {
    await hub.exec(RemoveUserFromFollowSet, pubkey, list).forEach((e) => publish("Remove from list", e));
  }, [list, publish, hub, pubkey]);

  return (
    <ErrorBoundary>
      <Card p="4">
        <Flex gap="2" alignItems="center">
          <UserAvatar pubkey={pubkey} />
          <Flex direction="column" flex={1} overflow="hidden">
            <UserLink pubkey={pubkey} fontWeight="bold" fontSize="lg" />
            <UserDnsIdentity pubkey={pubkey} />
          </Flex>
          <ButtonGroup>
            <SimpleUserFollowButton pubkey={pubkey} variant="outline" />
            <IconButton
              aria-label="Remove from list"
              icon={<TrashIcon />}
              colorScheme="red"
              variant="ghost"
              onClick={remove.run}
              isLoading={remove.loading}
            />
          </ButtonGroup>
        </Flex>
        <Box mt="2">
          <UserAboutContent pubkey={pubkey} noOfLines={2} />
        </Box>
      </Card>
    </ErrorBoundary>
  );
}

export default function FollowSetView({ event }: { event: NostrEvent }) {
  const account = useActiveAccount();
  const title = getListTitle(event);
  const people = useMemo(() => getProfilePointersFromList(event), [event]);
  const edit = useDisclosure();

  const isAuthor = useMemo(() => event.pubkey === account?.pubkey, [event, account]);

  return (
    <SimpleView
      maxW="8xl"
      title={title}
      center
      actions={
        <ButtonGroup ms="auto">
          <Button
            as={RouterLink}
            to={{ pathname: "/", search: new URLSearchParams({ people: getReplaceableAddress(event) }).toString() }}
          >
            View Feed
          </Button>
          {isAuthor && (
            <Button onClick={edit.onOpen} colorScheme="primary">
              Edit
            </Button>
          )}
          <ListMenu list={event} aria-label="List options" variant="ghost" />
        </ButtonGroup>
      }
    >
      <ListPageHeader list={event} />

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="4">
        {people.map((person) => (
          <UserCard key={person.pubkey} pubkey={person.pubkey} list={event} />
        ))}
      </SimpleGrid>

      <GenericCommentSection event={event} />

      {edit.isOpen && <ListEditModal isOpen list={event} onClose={edit.onClose} />}
    </SimpleView>
  );
}
