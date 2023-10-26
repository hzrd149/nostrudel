import { memo } from "react";
import { Flex } from "@chakra-ui/react";

import PostVoteButtons from "./post-vote-buttions";
import CommunityPost from "./community-post";
import { NostrEvent } from "../../../types/nostr-event";

const ApprovedEvent = memo(({ event, approvals }: { event: NostrEvent; approvals: NostrEvent[] }) => {
  return (
    <Flex gap="2" alignItems="flex-start">
      <PostVoteButtons event={event} flexShrink={0} />
      <CommunityPost event={event} approvals={approvals} flex={1} />
    </Flex>
  );
});

export default ApprovedEvent;
