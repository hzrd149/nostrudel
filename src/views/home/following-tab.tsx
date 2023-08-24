import { useCallback } from "react";
import { Flex, FormControl, FormLabel, Switch } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { Kind } from "nostr-tools";

import { isReply, truncatedId } from "../../helpers/nostr/events";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import RequireCurrentAccount from "../../providers/require-current-account";
import { NostrEvent } from "../../types/nostr-event";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import useUserContactList from "../../hooks/use-user-contact-list";
import { getPubkeysFromList } from "../../helpers/nostr/lists";

function FollowingTabBody() {
  const account = useCurrentAccount()!;
  const contacts = useUserContactList(account.pubkey);
  const [search, setSearch] = useSearchParams();
  const showReplies = search.has("replies");
  const onToggle = () => {
    showReplies ? setSearch({}) : setSearch({ replies: "show" });
  };

  const timelinePageEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      return timelinePageEventFilter(event);
    },
    [showReplies, timelinePageEventFilter],
  );

  const following = contacts ? getPubkeysFromList(contacts).map((p) => p.pubkey) : [];
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(
    `${truncatedId(account.pubkey)}-following`,
    readRelays,
    { authors: following, kinds: [Kind.Text, Kind.Repost, 2] },
    { enabled: following.length > 0, eventFilter },
  );

  const header = (
    <Flex px="2">
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="show-replies" mb="0">
          Show Replies
        </FormLabel>
        <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} />
      </FormControl>
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage timeline={timeline} header={header} pt="4" pb="8" />;
}

export default function FollowingTab() {
  return (
    <RequireCurrentAccount>
      <FollowingTabBody />
    </RequireCurrentAccount>
  );
}
