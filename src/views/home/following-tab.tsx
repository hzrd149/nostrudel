import { Flex, FormControl, FormLabel, Switch } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { isReply, truncatedId } from "../../helpers/nostr-event";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useCallback, useRef } from "react";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import RequireCurrentAccount from "../../providers/require-current-account";
import { NostrEvent } from "../../types/nostr-event";
import TimelineActionAndStatus from "../../components/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import GenericNoteTimeline from "../../components/timeline/generic-note-timeline";

function FollowingTabBody() {
  const account = useCurrentAccount()!;
  const readRelays = useReadRelayUrls();
  const contacts = useUserContacts(account.pubkey, readRelays);
  const [search, setSearch] = useSearchParams();
  const showReplies = search.has("replies");
  const onToggle = () => {
    showReplies ? setSearch({}) : setSearch({ replies: "show" });
  };

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      return true;
    },
    [showReplies]
  );

  const following = contacts?.contacts || [];
  const timeline = useTimelineLoader(
    `${truncatedId(account.pubkey)}-following`,
    readRelays,
    { authors: following, kinds: [1, 6] },
    { enabled: following.length > 0, eventFilter }
  );

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback} root={scrollBox}>
      <Flex py="4" direction="column" gap="2" overflowY="auto" overflowX="hidden" ref={scrollBox}>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="show-replies" mb="0">
            Show Replies
          </FormLabel>
          <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} />
        </FormControl>

        <GenericNoteTimeline timeline={timeline} />

        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
}

export default function FollowingTab() {
  return (
    <RequireCurrentAccount>
      <FollowingTabBody />
    </RequireCurrentAccount>
  );
}
