import { Kind } from "nostr-tools";

import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useSubject from "../../hooks/use-subject";
import { useNotificationTimeline } from "../../providers/notification-timeline";
import NotificationItem from "./notification-item";

export default function ZapNotificationsTab() {
  const timeline = useNotificationTimeline();
  const events = useSubject(timeline?.timeline).filter((e) => e.kind === Kind.Zap) ?? [];

  return (
    <>
      {events.map((event) => (
        <NotificationItem key={event.id} event={event} />
      ))}
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}
