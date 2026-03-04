import { useCallback, useRef, useState } from "react";
import {
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Spacer,
  Tag,
  TagCloseButton,
  TagLabel,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppTitle } from "../../hooks/use-app-title";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { isReply, isRepost } from "../../helpers/nostr/event";
import { AddIcon } from "../../components/icons";
import { NostrEvent } from "nostr-tools";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import NoteFilterTypeButtons from "../../components/note-filter-type-buttons";
import { useRouteStateBoolean } from "../../hooks/use-route-state-value";
import { useReadRelays } from "../../hooks/use-client-relays";

function HashTagPage() {
  const navigate = useNavigate();
  const { hashtag: primaryHashtag } = useParams() as { hashtag?: string };
  const [searchParams, setSearchParams] = useSearchParams();

  // Combine the primary route hashtag with any additional hashtags from search params
  const extraHashtags = searchParams.getAll("t");
  const hashtags = primaryHashtag
    ? [primaryHashtag, ...extraHashtags.filter((t) => t !== primaryHashtag)]
    : extraHashtags;

  useAppTitle(hashtags.map((t) => "#" + t).join(" "));

  const showReplies = useRouteStateBoolean("show-replies", true);
  const showReposts = useRouteStateBoolean("show-reposts", true);

  const readRelays = useReadRelays();

  const { listId, filter } = usePeopleListContext();
  const timelinePageEventFilter = useTimelinePageEventFilter();
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (muteFilter(event)) return false;
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelinePageEventFilter(event);
    },
    [showReplies.isOpen, showReposts.isOpen, muteFilter, timelinePageEventFilter],
  );

  const timelineKey = `${listId ?? "global"}-${hashtags.join("+")}-hashtag`;
  const { loader, timeline } = useTimelineLoader(
    timelineKey,
    readRelays,
    hashtags.length > 0 ? { kinds: [1], "#t": hashtags, ...filter } : undefined,
    { eventFilter },
  );

  // Input for adding a new hashtag
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addHashtag = (raw: string) => {
    const tag = raw.trim().replace(/^#+/, "").toLowerCase();
    if (!tag || hashtags.includes(tag)) return;

    if (!primaryHashtag) {
      // No primary hashtag yet — navigate to /t/:tag
      navigate({ pathname: "/t/" + tag, search: searchParams.toString() });
    } else {
      // Add as search param
      const next = new URLSearchParams(searchParams);
      next.append("t", tag);
      setSearchParams(next);
    }
    setInputValue("");
  };

  const removeHashtag = (tag: string) => {
    if (tag === primaryHashtag) {
      // Removing the primary hashtag; promote first extra to primary
      const remaining = hashtags.filter((t) => t !== tag);
      if (remaining.length === 0) {
        navigate("/t");
      } else {
        const [newPrimary, ...rest] = remaining;
        const next = new URLSearchParams();
        for (const r of rest) next.append("t", r);
        // preserve other (non-t) search params
        for (const [k, v] of searchParams.entries()) {
          if (k !== "t") next.append(k, v);
        }
        navigate({ pathname: "/t/" + newPrimary, search: next.toString() });
      }
    } else {
      // Just remove from search params
      const next = new URLSearchParams();
      for (const [k, v] of searchParams.entries()) {
        if (k === "t" && v === tag) continue;
        next.append(k, v);
      }
      setSearchParams(next);
    }
  };

  const header = (
    <Flex gap="2" alignItems="center" wrap="wrap">
      <Wrap align="center" flex={1}>
        {hashtags.map((tag) => (
          <WrapItem key={tag}>
            <Tag size="lg" borderRadius="full" variant="solid" colorScheme="primary" fontSize="md" px="3" py="1">
              <TagLabel>#{tag}</TagLabel>
              <TagCloseButton onClick={() => removeHashtag(tag)} aria-label={`Remove #${tag}`} />
            </Tag>
          </WrapItem>
        ))}
        <WrapItem>
          <InputGroup size="sm" maxW="48">
            <Input
              ref={inputRef}
              placeholder="Add hashtag..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHashtag(inputValue);
                }
              }}
              borderRadius="full"
              pr="8"
            />
            <InputRightElement>
              <IconButton
                size="xs"
                aria-label="Add hashtag"
                icon={<AddIcon />}
                onClick={() => addHashtag(inputValue)}
                variant="ghost"
              />
            </InputRightElement>
          </InputGroup>
        </WrapItem>
      </Wrap>
      <PeopleListSelection />
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <Spacer />
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage loader={loader} timeline={timeline} header={header} pt="2" pb="12" px="2" />;
}

export default function HashTagView() {
  return (
    <PeopleListProvider initList="global">
      <HashTagPage />
    </PeopleListProvider>
  );
}
