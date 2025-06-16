import { LinkBox, Text } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import RouterLink from "../../../../components/router-link";
import Timestamp from "../../../../components/timestamp";
import { notices$ } from "../../../../services/pool";

export default function NoticesTab() {
  const notices = useObservableEagerState(notices$);

  return (
    <>
      {notices.map((notice) => (
        <LinkBox key={notice.timestamp + notice.message} px="2" py="1" fontFamily="monospace">
          <HoverLinkOverlay as={RouterLink} to={`/relays/${encodeURIComponent(notice.from)}`} fontWeight="bold">
            {notice.from}
          </HoverLinkOverlay>
          <Timestamp timestamp={notice.timestamp.getTime() / 1000} ml={2} />
          <Text fontFamily="monospace">{notice.message}</Text>
        </LinkBox>
      ))}
    </>
  );
}
