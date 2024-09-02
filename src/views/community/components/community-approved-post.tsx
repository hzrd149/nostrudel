import { memo } from "react";
import { Card, Flex } from "@chakra-ui/react";

import EventVoteButtons from "../../../components/reactions/event-vote-buttions";
import CommunityPost from "./community-post";
import { NostrEvent } from "../../../types/nostr-event";

const ApprovedEvent = memo(
  ({ event, approvals, showCommunity }: { event: NostrEvent; approvals: NostrEvent[]; showCommunity?: boolean }) => {
    return (
      <Flex gap="2" alignItems="flex-start">
        <Card borderRadius="lg">
          <EventVoteButtons event={event} flexShrink={0} />
        </Card>
        <CommunityPost event={event} approvals={approvals} flex={1} showCommunity={showCommunity} />
      </Flex>
    );
  },
);

export default ApprovedEvent;
