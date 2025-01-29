import { LinkBox, Text } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import RouterLink from "../../../../components/router-link";
import Timestamp from "../../../../components/timestamp";
import { notices$ } from "../../../../services/rx-nostr";

export default function NoticesTab() {
  const notices = useObservable(notices$);

  return (
    <>
      {notices.map((notice) => (
        <LinkBox key={notice.timestamp + notice.message} px="2" py="1" fontFamily="monospace">
          <HoverLinkOverlay as={RouterLink} to={`/r/${encodeURIComponent(notice.from)}`} fontWeight="bold">
            {notice.from}
          </HoverLinkOverlay>
          <Timestamp timestamp={notice.timestamp} ml={2} />
          <Text fontFamily="monospace">{notice.message}</Text>
        </LinkBox>
      ))}
    </>
  );
}
