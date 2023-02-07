import React, { useEffect, useState } from "react";
import { SkeletonText } from "@chakra-ui/react";
import { useSubscription } from "../../hooks/use-subscription";
import { useRelays } from "../../providers/relay-provider";
import { Post } from "../../components/post";
import moment from "moment/moment";
import { NostrEvent } from "../../types/nostr-event";

export const GlobalView = () => {
  const { relays } = useRelays();
  const [events, setEvents] = useState<Record<string, NostrEvent>>({});

  const sub = useSubscription(
    relays,
    { kinds: [1], limit: 10, since: moment().startOf("day").valueOf() / 1000 },
    "global-events"
  );

  useEffect(() => {
    const s = sub.onEvent.subscribe((event) => {
      setEvents((dir) => {
        if (!dir[event.id]) {
          return { [event.id]: event, ...dir };
        }
        return dir;
      });
    });

    return () => s.unsubscribe();
  }, [sub]);

  const timeline = Object.values(events).sort(
    (a, b) => b.created_at - a.created_at
  );

  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  if (timeline.length > 20) timeline.length = 20;

  return (
    <>
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </>
  );
};
