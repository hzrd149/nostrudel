import { Button, Flex, FormControl, FormLabel, Switch } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { Note } from "../../components/note";
import { isReply, truncatedId } from "../../helpers/nostr-event";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { AddIcon } from "@chakra-ui/icons";
import { useCallback, useContext, useRef } from "react";
import { PostModalContext } from "../../providers/post-modal-provider";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import RepostNote from "../../components/repost-note";
import RequireCurrentAccount from "../../providers/require-current-account";
import { NostrEvent } from "../../types/nostr-event";
import TimelineActionAndStatus from "../../components/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";

function FollowingTabBody() {
  const account = useCurrentAccount()!;
  const readRelays = useReadRelayUrls();
  const { openModal } = useContext(PostModalContext);
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

  const events = useSubject(timeline.timeline);

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback} root={scrollBox}>
      <Flex py="4" direction="column" gap="2" overflowY="auto" overflowX="hidden" ref={scrollBox}>
        <Button
          variant="outline"
          leftIcon={<AddIcon />}
          onClick={() => openModal()}
          isDisabled={account.readonly}
          flexShrink={0}
        >
          New Post
        </Button>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="show-replies" mb="0">
            Show Replies
          </FormLabel>
          <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} />
        </FormControl>
        {events.map((event) =>
          event.kind === 6 ? (
            <RepostNote key={event.id} event={event} maxHeight={600} />
          ) : (
            <Note key={event.id} event={event} maxHeight={600} />
          )
        )}

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
