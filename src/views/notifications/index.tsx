import { useCallback, useMemo } from "react";
import { Tab, TabList, TabPanel, TabPanelProps, TabPanels, Tabs, useDisclosure } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import { NostrEvent } from "../../types/nostr-event";
import RequireCurrentAccount from "../../providers/require-current-account";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useNotificationTimeline } from "../../providers/notification-timeline";
import { getReferences } from "../../helpers/nostr/events";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import NotificationItem from "./notification-item";

function RepliesNotificationsTab({ events }: { events: NostrEvent[] }) {
  const timeline = useNotificationTimeline();
  const filtered = events.filter((event) => {
    if (event.kind === Kind.Text) {
      const refs = getReferences(event);
      return !!refs.replyId;
    }
    return false;
  });

  return (
    <>
      {filtered.map((event) => (
        <NotificationItem key={event.id} event={event} />
      ))}
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}

function MentionsNotificationsTab({ events }: { events: NostrEvent[] }) {
  const timeline = useNotificationTimeline();
  const filtered = events.filter((event) => {
    if (event.kind === Kind.Text) {
      const refs = getReferences(event);
      return !refs.replyId;
    }
    return false;
  });

  return (
    <>
      {filtered.map((event) => (
        <NotificationItem key={event.id} event={event} />
      ))}
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}

function ReactionsNotificationsTab({ events }: { events: NostrEvent[] }) {
  const timeline = useNotificationTimeline();
  const filtered = events.filter((e) => e.kind === Kind.Reaction);

  return (
    <>
      {filtered.map((event) => (
        <NotificationItem key={event.id} event={event} />
      ))}
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}

function SharesNotificationsTab({ events }: { events: NostrEvent[] }) {
  const timeline = useNotificationTimeline();
  const filtered = events.filter((e) => e.kind === Kind.Repost);

  return (
    <>
      {filtered.map((event) => (
        <NotificationItem key={event.id} event={event} />
      ))}
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}

function ZapNotificationsTab({ events }: { events: NostrEvent[] }) {
  const timeline = useNotificationTimeline();
  const filtered = events.filter((e) => e.kind === Kind.Zap);

  return (
    <>
      {filtered.map((event) => (
        <NotificationItem key={event.id} event={event} />
      ))}
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}

function NotificationsPage() {
  const { people } = usePeopleListContext();
  const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);

  const timeline = useNotificationTimeline();
  const callback = useTimelineCurserIntersectionCallback(timeline);
  const events = useSubject(timeline?.timeline).filter((e) => {
    if (peoplePubkeys && e.kind !== Kind.Zap && !peoplePubkeys.includes(e.pubkey)) return false;
    return true;
  });

  const tabPanelProps: TabPanelProps = { px: "0", pt: "2", display: "flex", flexDirection: "column", gap: "2" };

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Tabs isLazy colorScheme="primary">
          <TabList overflowX="auto" overflowY="hidden">
            <Tab>Replies</Tab>
            <Tab>Mentions</Tab>
            <Tab>Reactions</Tab>
            <Tab>Shares</Tab>
            <Tab>Zaps</Tab>
            <PeopleListSelection ml="auto" flexShrink={0} />
          </TabList>
          <TabPanels>
            <TabPanel {...tabPanelProps}>
              <RepliesNotificationsTab events={events} />
            </TabPanel>
            <TabPanel {...tabPanelProps}>
              <MentionsNotificationsTab events={events} />
            </TabPanel>
            <TabPanel {...tabPanelProps}>
              <ReactionsNotificationsTab events={events} />
            </TabPanel>
            <TabPanel {...tabPanelProps}>
              <SharesNotificationsTab events={events} />
            </TabPanel>
            <TabPanel {...tabPanelProps}>
              <ZapNotificationsTab events={events} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function NotificationsView() {
  return (
    <RequireCurrentAccount>
      <PeopleListProvider initList="global">
        <NotificationsPage />
      </PeopleListProvider>
    </RequireCurrentAccount>
  );
}
