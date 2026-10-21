import { Button, ButtonGroup, Flex, Heading, SkeletonText, Spinner } from "@chakra-ui/react";
import { BookmarkPointer } from "applesauce-common/helpers";
import {
  getAddressPointerFromATag,
  getEventPointerFromETag,
  isATag,
  isETag,
  getReplaceableAddressFromPointer,
  isEventPointer,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { useParams } from "react-router-dom";

import { UnbookmarkEvent } from "applesauce-actions/actions";
import { useActionRunner, useActiveAccount, use$ } from "applesauce-react/hooks";
import { EmbedEventCard } from "../../components/embed-event/card";
import SimpleView from "../../components/layout/presets/simple-view";
import TimelineItem from "../../components/timeline/timeline-item";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserName from "../../components/user/user-name";
import useAddressableEvent from "../../hooks/use-addressable-event";
import useAsyncAction from "../../hooks/use-async-action";
import useCastUser from "../../hooks/use-cast-user";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import { usePublishEvent } from "../../providers/global/publish-provider";
import ListMenu from "../lists/components/list-menu";

function RemoveBookmarkButton({ event, hidden }: { event: NostrEvent; hidden?: boolean }) {
  const actions = useActionRunner();
  const publish = usePublishEvent();

  const remove = useAsyncAction(async () => {
    await actions.exec(UnbookmarkEvent, event, undefined, hidden).forEach((e) => publish("Remove bookmark", e));
  }, [event, hidden, actions, publish]);

  return (
    <Button colorScheme="red" onClick={remove.run} isLoading={remove.loading}>
      Remove
    </Button>
  );
}

function BookmarkEventItem({ pointer, hidden }: { pointer: EventPointer; hidden?: boolean }) {
  const event = useSingleEvent(pointer);

  if (!event) return <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />;

  return (
    <>
      <TimelineItem event={event} visible />
      <ButtonGroup ml="auto" size="sm">
        <RemoveBookmarkButton event={event} hidden={hidden} />
      </ButtonGroup>
    </>
  );
}
function BookmarkAddressItem({ pointer, hidden }: { pointer: AddressPointer; hidden?: boolean }) {
  const event = useAddressableEvent(pointer);
  if (!event) return <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />;

  return (
    <>
      <EmbedEventCard event={event} />
      <ButtonGroup ml="auto" size="sm">
        <RemoveBookmarkButton event={event} hidden={hidden} />
      </ButtonGroup>
    </>
  );
}

function HiddenBookmarkItem({ pointer }: { pointer: BookmarkPointer }) {
  if (isEventPointer(pointer)) return <BookmarkEventItem pointer={pointer} hidden />;
  return <BookmarkAddressItem pointer={pointer} hidden />;
}

function BookmarksPage({ pubkey }: { pubkey: string }) {
  const bookmarks = use$(useCastUser(pubkey).bookmarks$);
  // hidden bookmarks are only available once something has unlocked the list's hidden tags
  const hidden = use$(bookmarks?.hidden$);
  const list = bookmarks?.event;

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
      maxW="6xl"
      center
    >
      {Array.from(list.tags)
        .reverse()
        .map((tag) => {
          if (isETag(tag)) {
            const pointer = getEventPointerFromETag(tag);
            if (!pointer) return null; // v5: can return null
            return <BookmarkEventItem key={pointer.id} pointer={pointer} />;
          } else if (isATag(tag)) {
            const pointer = getAddressPointerFromATag(tag);
            if (!pointer) return null; // v5: can return null
            return <BookmarkAddressItem key={tag[1]} pointer={pointer} />;
          }
          return null;
        })}
      {hidden
        ?.slice()
        .reverse()
        .map((pointer) => (
          <HiddenBookmarkItem
            key={"hidden-" + (isEventPointer(pointer) ? pointer.id : getReplaceableAddressFromPointer(pointer))}
            pointer={pointer}
          />
        ))}
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
