import React, { useState } from "react";
import { Card, CardBody, SkeletonText } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import settingsService from "../../services/settings";
import { useSignal } from "../../hooks/use-signal";
import { useSubscription } from "../../helpers/use-subscription";

const relayUrls = await settingsService.getRelays();

export const UserPostsTab = ({ pubkey }) => {
  const [events, setEvents] = useState({});

  const sub = useSubscription(relayUrls, { authors: [pubkey] }, [pubkey]);

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

  return timeline.map((event) => (
    <Card key={event.id}>
      <CardBody>
        <ReactMarkdown>{event.content}</ReactMarkdown>
      </CardBody>
    </Card>
  ));
};
