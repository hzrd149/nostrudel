import { Button, Flex, FormControl, FormLabel, Spinner, Switch } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import { Note } from "../../components/note";
import { isNote } from "../../helpers/nostr-event";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { AddIcon } from "@chakra-ui/icons";
import { useContext } from "react";
import { PostModalContext } from "../../providers/post-modal-provider";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";

export default function FollowingTab() {
  const account = useCurrentAccount();
  const relays = useReadRelayUrls();
  const { openModal } = useContext(PostModalContext);
  const contacts = useUserContacts(account.pubkey);
  const [search, setSearch] = useSearchParams();
  const showReplies = search.has("replies");
  const onToggle = () => {
    showReplies ? setSearch({}) : setSearch({ replies: "show" });
  };

  const following = contacts?.contacts || [];
  const { events, loading, loadMore } = useTimelineLoader(
    `${account.pubkey}-following-posts`,
    relays,
    { authors: following, kinds: [1], since: moment().subtract(2, "hour").unix() },
    { pageSize: moment.duration(2, "hour").asSeconds(), enabled: following.length > 0 }
  );

  const timeline = showReplies ? events : events.filter(isNote);

  return (
    <Flex direction="column" gap="2">
      <Button variant="outline" leftIcon={<AddIcon />} onClick={() => openModal()} isDisabled={account.readonly}>
        New Post
      </Button>
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="show-replies" mb="0">
          Show Replies
        </FormLabel>
        <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} />
      </FormControl>
      {timeline.map((event) => (
        <Note key={event.id} event={event} maxHeight={300} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
}
