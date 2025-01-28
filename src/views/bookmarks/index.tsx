import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { Button, ButtonGroup, Flex, Heading, SkeletonText, Spinner } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { NostrEvent } from "nostr-tools";
import { getAddressPointerFromATag, getEventPointerFromETag, isATag, isETag } from "applesauce-core/helpers";

import { useActiveAccount } from "applesauce-react/hooks";
import TimelineItem from "../../components/timeline-page/generic-note-timeline/timeline-item";
import useSingleEvent from "../../hooks/use-single-event";
import userUserBookmarksList from "../../hooks/use-user-bookmarks-list";
import UserName from "../../components/user/user-name";
import ListMenu from "../lists/components/list-menu";
import UserAvatarLink from "../../components/user/user-avatar-link";
import useEventBookmarkActions from "../../hooks/use-event-bookmark-actions";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { EmbedEvent } from "../../components/embed-event";
import SimpleView from "../../components/layout/presets/simple-view";
import useMaxPageWidth from "../../hooks/use-max-page-width";

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
function BookmarkAddressItem({ pointer }: { pointer: AddressPointer }) {
  const event = useReplaceableEvent(pointer);
  if (!event) return <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />;

  return (
    <>
      <EmbedEvent event={event} />
      <ButtonGroup ml="auto" size="sm">
        <RemoveBookmarkButton event={event} />
      </ButtonGroup>
    </>
  );
}

function BookmarksPage({ pubkey }: { pubkey: string }) {
  const { list } = userUserBookmarksList(pubkey, undefined, true);
  const maxWidth = useMaxPageWidth();

  if (!list) return <Spinner />;

  return (
    <SimpleView
      title={
        <Flex gap="2" alignItems="center">
          <UserAvatarLink pubkey={pubkey} size="sm" />
          <Heading size="md">
            <UserName pubkey={list.pubkey} />
            's Bookmarks
          </Heading>
        </Flex>
      }
      actions={<ListMenu ml="auto" size="sm" list={list} aria-label="More options" />}
      maxW={maxWidth}
      center
    >
      {Array.from(list.tags)
        .reverse()
        .map((tag) => {
          if (isETag(tag)) {
            const pointer = getEventPointerFromETag(tag);
            return <BookmarkEventItem key={pointer.id} pointer={pointer} />;
          } else if (isATag(tag)) {
            const pointer = getAddressPointerFromATag(tag);
            return <BookmarkAddressItem key={tag[1]} pointer={pointer} />;
          }
          return null;
        })}
    </SimpleView>
  );
}

function BookmarksViewKeyInParams() {
  const pointer = useParamsProfilePointer("pubkey");
  return <BookmarksPage pubkey={pointer.pubkey} />;
}
export default function BookmarksView() {
  const params = useParams();
  const account = useActiveAccount();

  if (params.pubkey) return <BookmarksViewKeyInParams />;
  else if (account?.pubkey) return <BookmarksPage pubkey={account.pubkey} />;

  return <Spinner />;
}
