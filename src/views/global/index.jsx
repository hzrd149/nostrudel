import React, { useState } from "react";
import { SkeletonText } from "@chakra-ui/react";
import { useSubscription } from "../../helpers/use-subscription";
import { useSignal } from "../../hooks/use-signal";
import { useRelays } from "../../providers/relay-provider";
import { Post } from "../../components/post";

export const GlobalView = () => {
  const { relays } = useRelays();
  const [events, setEvents] = useState({});

  const sub = useSubscription(relays, { kinds: [1], limit: 10 }, []);

  useSignal(
    sub?.onEvent,
    (event) => {
      if (event.kind === 1) {
        setEvents((dir) => ({ [event.id]: event, ...dir }));
      }
    },
    [setEvents]
  );

  const timeline = Object.values(events).sort(
    (a, b) => a.created_at - b.created_at
  );

  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  return (
    <>
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </>
  );
};
