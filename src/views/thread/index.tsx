import { Box, Heading, Link, LinkBox, Spinner, useDisclosure } from "@chakra-ui/react";
import { Note } from "applesauce-common/casts";
import { use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import ExpandableToggleButton from "../../components/expandable-toggle-button";
import LoadingNostrLink from "../../components/loading-nostr-link";
import TextNoteContents from "../../components/timeline/note/text-note-contents";
import Timestamp from "../../components/timestamp";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserDnsIdentityIcon from "../../components/user/user-dns-identity-icon";
import UserLink from "../../components/user/user-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useCastEvent from "../../hooks/use-cast-event";
import { useReadRelays } from "../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import useThreadTimelineLoader from "../../hooks/use-thread-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { getSharableEventAddress } from "../../services/relay-hints";
import MutedNotePlaceholder from "./components/muted-note-placeholder";
import ThreadPost from "./components/thread-post";

function ParentCard({ event, level }: { event: NostrEvent; level: number }) {
  const ref = useEventIntersectionRef(event);
  const more = useDisclosure({ defaultIsOpen: level < 2 });
  const muteFilter = useClientSideMuteFilter();
  const isMuted = muteFilter(event);
  const [alwaysShow, setAlwaysShow] = useState(false);

  return (
    <LinkBox
      gap="2"
      overflow="hidden"
      p="2"
      flexShrink={0}
      borderWidth="0 2px 0 2px"
      rounded="none"
      borderColor="var(--chakra-colors-chakra-border-color)"
      ref={ref}
      role="article"
    >
      <ExpandableToggleButton
        toggle={more}
        aria-label={more.isOpen ? "Collapse post" : "Expand post"}
        size="sm"
        float="right"
      />
      <Box float="left" mr="2">
        <UserAvatarLink pubkey={event.pubkey} size="xs" mr="2" aria-label="avatar" />
        <UserLink pubkey={event.pubkey} fontWeight="bold" mr="1" />
        <UserDnsIdentityIcon pubkey={event.pubkey} mr="2" />
        <Link
          as={RouterLink}
          to={`/n/${getSharableEventAddress(event)}`}
          aria-label={`Posted at ${new Date(event.created_at * 1000).toLocaleString()}`}
        >
          <Timestamp timestamp={event.created_at} />
        </Link>
      </Box>
      {more.isOpen ? (
        isMuted && !alwaysShow ? (
          <MutedNotePlaceholder event={event} showHeader={false} onShowAnyway={() => setAlwaysShow(true)} />
        ) : (
          <ContentSettingsProvider blurMedia={false}>
            <br />
            <TextNoteContents event={event} aria-expanded="true" />
          </ContentSettingsProvider>
        )
      ) : (
        <Link
          as={RouterLink}
          to={`/n/${getSharableEventAddress(event)}`}
          noOfLines={1}
          fontStyle="italic"
          aria-expanded="false"
        >
          {isMuted ? "Muted user or note" : event.content}
        </Link>
      )}
    </LinkBox>
  );
}

/**
 * Recursively walks up the NIP-10 reply chain via Note.replyingTo$, rendering
 * each ancestor above the current note. Each level only subscribes to its own
 * parent observable.
 */
function ParentChain({ note, level = 0 }: { note: Note; level?: number }) {
  const parentEvent = use$(() => note.replyingTo$, [note]);
  const parentNote = useCastEvent(parentEvent, Note);
  const replyPointer = note.references.reply?.e;

  // No parent referenced — we're at the top of the chain.
  if (!replyPointer) return null;

  // Parent referenced but not yet in the event store — show a loading placeholder.
  if (!parentEvent) return <LoadingNostrLink link={{ type: "nevent", data: replyPointer }} />;

  // Parent loaded but not a kind 1 note (cast failed) — render it as a leaf without recursing.
  if (!parentNote) return <ParentCard event={parentEvent} level={level} />;

  return (
    <>
      <ParentChain note={parentNote} level={level + 1} />
      <ParentCard event={parentNote.event} level={level} />
    </>
  );
}

export default function ThreadView() {
  const pointer = useParamsEventPointer("id");
  const readRelays = useReadRelays(pointer.relays);

  const focusedEvent = useSingleEvent(pointer);
  const { rootPointer, loader } = useThreadTimelineLoader(focusedEvent, readRelays);
  const rootEvent = useSingleEvent(rootPointer);

  const focusedNote = useCastEvent(focusedEvent, Note);
  const rootNote = useCastEvent(rootEvent, Note);

  const callback = useTimelineCurserIntersectionCallback(loader);

  const isFocusedRoot = !!focusedNote && !!rootNote && focusedNote.event.id === rootNote.event.id;

  return (
    <VerticalPageLayout maxW="6xl" mx="auto" w="full">
      {!focusedEvent && (
        <>
          <Heading my="4">
            <Spinner /> Loading note
          </Heading>
          <LoadingNostrLink link={{ type: "nevent", data: pointer }} />
        </>
      )}
      <IntersectionObserverProvider callback={callback}>
        {focusedNote &&
          (isFocusedRoot ? (
            <ThreadPost note={rootNote} initShowReplies focusId={focusedNote.event.id} />
          ) : (
            <>
              <ParentChain note={focusedNote} />
              <ThreadPost note={focusedNote} initShowReplies focusId={focusedNote.event.id} />
            </>
          ))}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
