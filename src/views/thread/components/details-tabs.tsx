import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { Note } from "applesauce-common/casts";
import { mapEventsToStore } from "applesauce-core";
import { use$ } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { ReactNode } from "react";
import { map } from "rxjs";

import { CAP_IS_WEB } from "../../../env";
import { getContentTagRefs } from "../../../helpers/nostr/event";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useEventZaps from "../../../hooks/use-event-zaps";
import useRouteSearchValue from "../../../hooks/use-route-search-value";
import { useUserInbox } from "../../../hooks/use-user-mailboxes";
import { eventStore } from "../../../services/event-store";
import pool from "../../../services/pool";
import { repliesByDate } from "../helpers";
import OtherAppsTab from "./tabs/other-apps";
import PostQuotesTab from "./tabs/quotes";
import PostReactionsTab from "./tabs/reactions";
import PostRepostsTab from "./tabs/reposts";
import UnknownTab from "./tabs/unknown";
import PostZapsTab from "./tabs/zaps";
import ThreadPost from "./thread-post";

const HiddenScrollbarTabList = styled(TabList)`
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none;
  }
`;

export default function DetailsTabs({ note }: { note: Note }) {
  const selected = useRouteSearchValue("tab", "replies");
  const inboxes = useUserInbox(note.event.pubkey);
  const readRelays = useReadRelays(inboxes);

  // Keep a live subscription open for this thread while viewing
  use$(() => {
    const id = note.id;
    return pool
      .subscription(readRelays, [
        { "#e": [id], limit: 100 },
        { "#q": [id], limit: 100 },
      ])
      .pipe(mapEventsToStore(eventStore));
  }, [note.id, readRelays.join(",")]);

  console.log('focused', note)

  const replies = use$(note.replies$);
  const reactions = use$(note.reactions$);
  const zaps = useEventZaps(note.event);

  const quotes = use$(
    () =>
      eventStore.timeline({ kinds: [kinds.ShortTextNote], "#q": [note.id] }).pipe(
        map((events) =>
          events.filter((e) => {
            return (
              e.tags.some((t) => t[0] === "q" && t[1] === note.event.id) ||
              getContentTagRefs(e.content, e.tags).some((t) => t[0] === "e" && t[1] === note.event.id)
            );
          }),
        ),
      ),
    [note.id, readRelays.join(",")],
  );

  const events = use$(() => eventStore.timeline({ "#e": [note.id] }), [note.id, readRelays.join(",")]);
  const reposts = events?.filter((e) => e.kind === kinds.Repost || e.kind === kinds.GenericRepost);

  const unknown = events?.filter(
    (e) =>
      e.kind !== kinds.ShortTextNote &&
      e.kind !== kinds.Zap &&
      e.kind !== kinds.Reaction &&
      e.kind !== kinds.Repost &&
      e.kind !== kinds.GenericRepost,
  );

  const tabs: { id: string; name: string; element: ReactNode; visible: boolean; right?: boolean }[] = [
    {
      id: "replies",
      name: `Replies (${replies?.length ?? 0})`,
      visible: true,
      element: (
        <TabPanel key="replies" display="flex" flexDirection="column" gap="2" py="2" pr="0" pl={{ base: 2, md: 4 }}>
          {repliesByDate(replies ?? []).map((child) => (
            <ThreadPost key={child.event.id} note={child} focusId={undefined} level={0} />
          ))}
        </TabPanel>
      ),
    },
    {
      id: "quotes",
      name: `Quotes (${quotes?.length ?? 0})`,
      visible: !!quotes && quotes?.length > 0,
      element: (
        <TabPanel key="quotes" p="0" py="2">
          <PostQuotesTab quotes={quotes ?? []} />
        </TabPanel>
      ),
    },
    {
      id: "zaps",
      name: `Zaps (${zaps.length})`,
      visible: zaps.length > 0,
      element: (
        <TabPanel key="zaps" p="0" py="2">
          <PostZapsTab zaps={zaps} />
        </TabPanel>
      ),
    },
    {
      id: "reposts",
      name: `Reposts (${reposts?.length ?? 0})`,
      visible: !!reposts && reposts?.length > 0,
      element: (
        <TabPanel key="reposts" p="0" py="2">
          <PostRepostsTab reposts={reposts ?? []} />
        </TabPanel>
      ),
    },
    {
      id: "reactions",
      name: `Reactions (${reactions?.length ?? 0})`,
      visible: !!reactions && reactions?.length > 0,
      element: (
        <TabPanel key="reactions" p="0">
          <PostReactionsTab reactions={reactions ?? []} />
        </TabPanel>
      ),
    },
    {
      id: "unknown",
      name: `Unknown (${unknown?.length ?? 0})`,
      visible: !!unknown && unknown?.length > 0,
      element: (
        <TabPanel key="unknown" p="0" py="2">
          <UnknownTab events={unknown ?? []} />
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
          <OtherAppsTab note={note} />
        </TabPanel>
      ),
    },
  ];

  const s = tabs.find((t) => t.id === selected.value);
  const index = s ? tabs.indexOf(s) : 0;

  return (
    <Tabs
      display="flex"
      flexDirection="column"
      flexGrow="1"
      isLazy
      index={index}
      onChange={(v) => {
        if (tabs[v]) selected.setValue(tabs[v].id, true);
        else selected.clearValue(true);
      }}
      h="full"
      colorScheme="primary"
      variant="solid-rounded"
      size="sm"
    >
      <HiddenScrollbarTabList px="2" gap="2" whiteSpace="pre" overflowX="auto">
        {tabs
          .filter((t) => t.visible)
          .map((tab) => (
            <Tab key={tab.id} ml={tab.right ? "auto" : undefined}>
              {tab.name}
            </Tab>
          ))}
      </HiddenScrollbarTabList>
      <TabPanels minH={{ base: "50vh", md: "0" }}>{tabs.filter((t) => t.visible).map((tab) => tab.element)}</TabPanels>
    </Tabs>
  );
}
