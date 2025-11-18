import { SimpleGrid } from "@chakra-ui/react";

import { AtIcon, LightningIcon, QuoteIcon, RepostIcon, ThreadIcon } from "../../components/icons";
import SimpleNavBox from "../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../components/layout/presets/simple-view";

export default function NotificationsView() {
  return (
    <SimpleView title="Notifications" flush>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }}>
        <SimpleNavBox
          icon={<ThreadIcon boxSize={12} />}
          title="Threads"
          description="View replies to your posts"
          to="/notifications/threads"
        />
        <SimpleNavBox
          icon={<AtIcon boxSize={12} />}
          title="Mentions"
          description="See where you've been mentioned"
          to="/notifications/mentions"
        />
        <SimpleNavBox
          icon={<QuoteIcon boxSize={12} />}
          title="Quotes"
          description="Who has quoted your notes"
          to="/notifications/quotes"
        />
        <SimpleNavBox
          icon={<RepostIcon boxSize={12} />}
          title="Reposts"
          description="Who has reposted your notes"
          to="/notifications/reposts"
        />
        <SimpleNavBox
          icon={<LightningIcon boxSize={12} />}
          title="Zaps"
          description="Lightning payments you've received"
          to="/notifications/zaps"
        />
      </SimpleGrid>
    </SimpleView>
  );
}
