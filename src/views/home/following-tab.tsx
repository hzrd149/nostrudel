import { Button, Flex, FormControl, FormLabel, Spinner, Switch } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { useInterval } from "react-use";
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
import useScrollPosition from "../../hooks/use-scroll-position";
import LoadMoreButton from "../../components/load-more-button";

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

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const scrollPosition = useScrollPosition(scrollBox);

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      return true;
    },
    [showReplies]
  );

  const following = contacts?.contacts || [];
  const { timeline, loader } = useTimelineLoader(
    `${truncatedId(account.pubkey)}-following`,
    readRelays,
    { authors: following, kinds: [1, 6] },
    { enabled: following.length > 0, eventFilter }
  );

  useInterval(() => {
    if (scrollPosition > 0.9) loader.loadMore();
  }, 1000);

  return (
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
      {timeline.map((event) =>
        event.kind === 6 ? (
          <RepostNote key={event.id} event={event} maxHeight={600} />
        ) : (
          <Note key={event.id} event={event} maxHeight={600} />
        )
      )}

      <LoadMoreButton timeline={loader} />
    </Flex>
  );
}

export default function FollowingTab() {
  return (
    <RequireCurrentAccount>
      <FollowingTabBody />
    </RequireCurrentAccount>
  );
}
