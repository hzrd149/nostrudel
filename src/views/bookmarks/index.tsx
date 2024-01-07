import { EventPointer } from "nostr-tools/lib/types/nip19";
import { Button, ButtonGroup, Flex, Heading, SkeletonText, Spinner } from "@chakra-ui/react";

import VerticalPageLayout from "../../components/vertical-page-layout";
import useCurrentAccount from "../../hooks/use-current-account";
import TimelineItem from "../../components/timeline-page/generic-note-timeline/timeline-item";
import useSingleEvent from "../../hooks/use-single-event";
import userUserBookmarksList from "../../hooks/use-user-bookmarks-list";
import UserName from "../../components/user-name";
import ListMenu from "../lists/components/list-menu";
import UserAvatarLink from "../../components/user-avatar-link";
import { NostrEvent } from "../../types/nostr-event";
import useEventBookmarkActions from "../../hooks/use-event-bookmark-actions";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import { useParams } from "react-router-dom";

function RemoveBookmarkButton({ event }: { event: NostrEvent }) {
  const { isLoading, removeBookmark } = useEventBookmarkActions(event);
  return (
    <Button colorScheme="red" onClick={removeBookmark} isLoading={isLoading}>
      Remove
    </Button>
  );
}

function BookmarkEventItem({ pointer }: { pointer: EventPointer }) {
  const event = useSingleEvent(pointer.id, pointer.relays);

  if (!event) return <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />;

  return (
    <>
      <TimelineItem event={event} visible />
      <ButtonGroup ml="auto" size="sm">
        <RemoveBookmarkButton event={event} />
      </ButtonGroup>
    </>
  );
}

function BookmarksPage({ pubkey }: { pubkey: string }) {
  const { list, eventPointers } = userUserBookmarksList(pubkey);

  if (!list) return <Spinner />;

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" mb="4">
        <UserAvatarLink pubkey={pubkey} />
        <Heading size="md">
          <UserName pubkey={list.pubkey} />
          's Bookmarks
        </Heading>
        <ListMenu ml="auto" size="sm" list={list} aria-label="More options" />
      </Flex>
      <Flex gap="2" direction="column" maxW="4xl" mx="auto" overflow="hidden" w="full">
        {Array.from(eventPointers)
          .reverse()
          .map((p) => (
            <BookmarkEventItem key={p.id} pointer={p} />
          ))}
      </Flex>
    </VerticalPageLayout>
  );
}

function BookmarksViewKeyInParams() {
  const pointer = useParamsProfilePointer("pubkey");
  return <BookmarksPage pubkey={pointer.pubkey} />;
}
export default function BookmarksView() {
  const params = useParams();
  const account = useCurrentAccount();

  if (params.pubkey) return <BookmarksViewKeyInParams />;
  else if (account?.pubkey) return <BookmarksPage pubkey={account.pubkey} />;

  return <Spinner />;
}
