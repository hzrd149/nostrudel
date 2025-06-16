import { Button, ButtonGroup, Flex, Heading, SkeletonText, Spinner } from "@chakra-ui/react";
import { getAddressPointerFromATag, getEventPointerFromETag, isATag, isETag } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { useParams } from "react-router-dom";

import { UnbookmarkEvent } from "applesauce-actions/actions";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { EmbedEventCard } from "../../components/embed-event/card";
import SimpleView from "../../components/layout/presets/simple-view";
import TimelineItem from "../../components/timeline-page/generic-note-timeline/timeline-item";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserName from "../../components/user/user-name";
import useAddressableEvent from "../../hooks/use-addressable-event";
import useAsyncAction from "../../hooks/use-async-action";
import useMaxPageWidth from "../../hooks/use-max-page-width";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import userUserBookmarksList from "../../hooks/use-user-bookmarks-list";
import { usePublishEvent } from "../../providers/global/publish-provider";
import ListMenu from "../lists/components/list-menu";

function RemoveBookmarkButton({ event }: { event: NostrEvent }) {
  const actions = useActionHub();
  const publish = usePublishEvent();

  const remove = useAsyncAction(async () => {
    await actions.exec(UnbookmarkEvent, event).forEach((e) => publish("Remove bookmark", e));
  }, [event, actions, publish]);

  return (
    <Button colorScheme="red" onClick={remove.run} isLoading={remove.loading}>
      Remove
    </Button>
  );
}

function BookmarkEventItem({ pointer }: { pointer: EventPointer }) {
  const event = useSingleEvent(pointer);

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
  const event = useAddressableEvent(pointer);
  if (!event) return <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />;

  return (
    <>
      <EmbedEventCard event={event} />
      <ButtonGroup ml="auto" size="sm">
        <RemoveBookmarkButton event={event} />
      </ButtonGroup>
    </>
  );
}

function BookmarksPage({ pubkey }: { pubkey: string }) {
  const maxWidth = useMaxPageWidth();
  const { list } = userUserBookmarksList(pubkey);

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
