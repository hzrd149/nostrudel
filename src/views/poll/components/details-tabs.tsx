import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { COMMENT_KIND, getPollRelays } from "applesauce-common/helpers";
import { CommentsModel } from "applesauce-common/models";
import { mapEventsToStore } from "applesauce-core";
import { getSeenRelays, mergeRelaySets } from "applesauce-core/helpers";
import { use$, useEventModel } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { ReactNode, useEffect, useMemo } from "react";
import { map } from "rxjs";

import GenericCommentForm from "../../../components/comment/generic-comment-form";
import { GenericComments } from "../../../components/comment/generic-comments";
import { CAP_IS_WEB } from "../../../env";
import { getContentTagRefs } from "../../../helpers/nostr/event";
import { getPollResponses, POLL_RESPONSE_KIND } from "../../../helpers/nostr/polls";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useRouteSearchValue from "../../../hooks/use-route-search-value";
import { useUserInbox } from "../../../hooks/use-user-mailboxes";
import { eventStore } from "../../../services/event-store";
import { pollResponseLoader } from "../../../services/loaders";
import pool from "../../../services/pool";
import OtherAppsTab from "../../thread/components/tabs/other-apps";
import PostQuotesTab from "../../thread/components/tabs/quotes";
import PostRepostsTab from "../../thread/components/tabs/reposts";
import PollVotesTab from "./votes-tab";

const HiddenScrollbarTabList = styled(TabList)`
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export default function PollDetailsTabs({
  poll,
  showCommentForm,
  onCloseCommentForm,
}: {
  poll: NostrEvent;
  showCommentForm?: boolean;
  onCloseCommentForm?: () => void;
}) {
  const selected = useRouteSearchValue("tab", "comments");
  const inboxes = useUserInbox(poll.pubkey);
  const readRelays = useReadRelays(inboxes);
  const pollResponseRelays = useMemo(
    () => mergeRelaySets(getPollRelays(poll), getSeenRelays(poll), readRelays),
    [poll, readRelays.join(",")],
  );
  const pollResponseRelayKey = pollResponseRelays.join(",");

  use$(() => {
    return pool
      .subscription(readRelays, [
        { "#e": [poll.id], limit: 100 },
        { "#q": [poll.id], limit: 100 },
        { "#E": [poll.id], kinds: [COMMENT_KIND], limit: 100 },
      ])
      .pipe(mapEventsToStore(eventStore));
  }, [poll.id, readRelays.join(",")]);

  useEffect(() => {
    const sub = pollResponseLoader({ value: poll.id, relays: pollResponseRelays }).subscribe();
    return () => sub.unsubscribe();
  }, [poll.id, pollResponseRelayKey]);

  const comments = useEventModel(CommentsModel, [poll]);
  const quotes = use$(
    () =>
      eventStore.timeline({ kinds: [kinds.ShortTextNote], "#q": [poll.id] }).pipe(
        map((events) =>
          events.filter((event) => {
            return (
              event.tags.some((tag) => tag[0] === "q" && tag[1] === poll.id) ||
              getContentTagRefs(event.content, event.tags).some((tag) => tag[0] === "e" && tag[1] === poll.id)
            );
          }),
        ),
      ),
    [poll.id, readRelays.join(",")],
  );
  const events = use$(() => eventStore.timeline({ "#e": [poll.id] }), [poll.id, readRelays.join(",")]);
  const reposts = events?.filter((event) => event.kind === kinds.Repost || event.kind === kinds.GenericRepost);
  const responseEvents =
    use$(
      () => eventStore.timeline({ kinds: [POLL_RESPONSE_KIND], "#e": [poll.id] }),
      [poll.id, pollResponseRelayKey],
    ) ?? [];
  const votes = useMemo(() => getPollResponses(poll, responseEvents), [poll, responseEvents]);

  const tabs: { id: string; name: string; element: ReactNode; visible: boolean; right?: boolean }[] = [
    {
      id: "comments",
      name: `Comments (${comments?.length ?? 0})`,
      visible: true,
      element: (
        <TabPanel key="comments" p="0" py="2">
          {showCommentForm && (
            <GenericCommentForm event={poll} onCancel={onCloseCommentForm} onSubmitted={onCloseCommentForm} />
          )}
          <GenericComments event={poll} />
        </TabPanel>
      ),
    },
    {
      id: "votes",
      name: `Votes (${votes.length})`,
      visible: true,
      element: (
        <TabPanel key="votes" p="0" py="2">
          <PollVotesTab poll={poll} responses={votes} />
        </TabPanel>
      ),
    },
    {
      id: "quotes",
      name: `Quotes (${quotes?.length ?? 0})`,
      visible: !!quotes && quotes.length > 0,
      element: (
        <TabPanel key="quotes" p="0" py="2">
          <PostQuotesTab quotes={quotes ?? []} />
        </TabPanel>
      ),
    },
    {
      id: "shares",
      name: `Shares (${reposts?.length ?? 0})`,
      visible: !!reposts && reposts.length > 0,
      element: (
        <TabPanel key="shares" p="0" py="2">
          <PostRepostsTab reposts={reposts ?? []} />
        </TabPanel>
      ),
    },
    {
      id: "other-apps",
      name: "Other Apps",
      visible: CAP_IS_WEB,
      right: true,
      element: (
        <TabPanel key="other-apps" p="0" py="2">
          <OtherAppsTab event={poll} />
        </TabPanel>
      ),
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.visible);
  const current = visibleTabs.find((tab) => tab.id === selected.value);
  const index = current ? visibleTabs.indexOf(current) : 0;

  return (
    <Tabs
      display="flex"
      flexDirection="column"
      flexGrow="1"
      isLazy
      index={index}
      onChange={(value) => {
        if (visibleTabs[value]) selected.setValue(visibleTabs[value].id, true);
        else selected.clearValue(true);
      }}
      h="full"
      colorScheme="primary"
      variant="solid-rounded"
      size="sm"
    >
      <HiddenScrollbarTabList px="2" gap="2" whiteSpace="pre" overflowX="auto">
        {visibleTabs.map((tab) => (
          <Tab key={tab.id} ml={tab.right ? "auto" : undefined}>
            {tab.name}
          </Tab>
        ))}
      </HiddenScrollbarTabList>
      <TabPanels minH={{ base: "50vh", md: "0" }}>{visibleTabs.map((tab) => tab.element)}</TabPanels>
    </Tabs>
  );
}
