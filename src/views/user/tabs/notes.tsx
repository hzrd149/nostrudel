import { Flex, Spacer } from "@chakra-ui/react";
import { NostrEvent, kinds } from "nostr-tools";
import { useCallback } from "react";

import NoteFilterTypeButtons from "../../../components/note-filter-type-buttons";
import { RelayIconStack } from "../../../components/relay-icon-stack";
import TimelinePage, { useTimelinePageEventFilter } from "../../../components/timeline-page";
import TimelineViewType from "../../../components/timeline-page/timeline-view-type";
import { isReply, isRepost } from "../../../helpers/nostr/event";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useRouteStateBoolean } from "../../../hooks/use-route-state-value";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";

export default function UserNotesTab() {
  const user = useParamsProfilePointer("pubkey");
  const mailboxes = useUserMailboxes(user);
  const readRelays = useReadRelays();

  const showReplies = useRouteStateBoolean("show-replies", false);
  const showReposts = useRouteStateBoolean("show-reposts", true);

  const timelineEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelineEventFilter(event);
    },
    [showReplies.isOpen, showReposts.isOpen, timelineEventFilter],
  );
  const { loader, timeline } = useTimelineLoader(
    user.pubkey + "-notes",
    mailboxes?.outboxes || readRelays,
    {
      authors: [user.pubkey],
      kinds: [kinds.ShortTextNote, kinds.Repost, kinds.GenericRepost, 2],
    },
    { eventFilter },
  );

  const header = (
    <Flex gap="2" alignItems="center">
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <Spacer />
      <RelayIconStack relays={readRelays} direction="row-reverse" maxRelays={4} />
      <TimelineViewType />
    </Flex>
  );

  return <TimelinePage header={header} loader={loader} timeline={timeline} p={0} />;
}
