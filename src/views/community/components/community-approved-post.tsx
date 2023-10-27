import { memo } from "react";
import { Flex } from "@chakra-ui/react";

import PostVoteButtons from "./post-vote-buttions";
import CommunityPost from "./community-post";
import { NostrEvent } from "../../../types/nostr-event";

const ApprovedEvent = memo(
  ({ event, approvals, showCommunity }: { event: NostrEvent; approvals: NostrEvent[]; showCommunity?: boolean }) => {
    return (
      <Flex gap="2" alignItems="flex-start">
        <PostVoteButtons event={event} flexShrink={0} />
        <CommunityPost event={event} approvals={approvals} flex={1} showCommunity={showCommunity} />
      </Flex>
    );
  },
);

export default ApprovedEvent;
