import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, SkeletonText, useMediaQuery } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { onEvent, subscribeToAuthor } from "../../services/relays";
import { useSignal } from "../../hooks/use-signal";
import { createSubscription } from "../../services/subscriptions";

export const UserPostsTab = ({ pubkey }) => {
  const [events, setEvents] = useState({});

  useEffect(() => {
    if (pubkey) {
      const sub = createSubscription({ authors: [pubkey] });

      sub.onEvent.addListener((event) => {
        if (event.kind === 1) {
          setEvents((dir) => ({ [event.id]: event, ...dir }));
        }
      });

      return () => sub.close();
    }
  }, [pubkey]);

  const timeline = Object.values(events).sort(
    (a, b) => a.created_at - b.created_at
  );

  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  return timeline.map((event) => (
    <Card key={event.id}>
      <CardBody>
        <ReactMarkdown>{event.content}</ReactMarkdown>
      </CardBody>
    </Card>
  ));
};
