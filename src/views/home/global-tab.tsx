import { useCallback, useRef } from "react";
import { Flex, FormControl, FormLabel, Select, Switch, useDisclosure } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { unique } from "../../helpers/array";
import { isReply } from "../../helpers/nostr-event";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import TimelineActionAndStatus from "../../components/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import GenericNoteTimeline from "../../components/generric-note-timeline";

export default function GlobalTab() {
  useAppTitle("global");
  const defaultRelays = useReadRelayUrls();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRelay = searchParams.get("relay") ?? "";
  const setSelectedRelay = (url: string) => {
    if (url) {
      setSearchParams({ relay: url });
    } else setSearchParams({});
  };
  const { isOpen: showReplies, onToggle } = useDisclosure();

  const availableRelays = unique([...defaultRelays, selectedRelay]).filter(Boolean);

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies && isReply(event)) return false;
      return true;
    },
    [showReplies]
  );

  const timeline = useTimelineLoader(
    [`global`, ...selectedRelay].join(","),
    selectedRelay ? [selectedRelay] : [],
    { kinds: [1] },
    { eventFilter }
  );

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback} root={scrollBox}>
      <Flex py="4" direction="column" gap="2" overflowY="auto" overflowX="hidden" ref={scrollBox}>
        <Flex gap="2">
          <Select
            placeholder="Select Relay"
            maxWidth="250"
            value={selectedRelay}
            onChange={(e) => {
              setSelectedRelay(e.target.value);
            }}
          >
            {availableRelays.map((url) => (
              <option key={url} value={url}>
                {url}
              </option>
            ))}
          </Select>
          <FormControl display="flex" alignItems="center">
            <Switch id="show-replies" isChecked={showReplies} onChange={onToggle} mr="2" />
            <FormLabel htmlFor="show-replies" mb="0">
              Show Replies
            </FormLabel>
          </FormControl>
        </Flex>

        <GenericNoteTimeline timeline={timeline} />
        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
}
