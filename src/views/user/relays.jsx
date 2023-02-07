import React, { useEffect, useState } from "react";
import { Card, CardBody, SkeletonText } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { onEvent, subscribeToAuthor } from "../../services/relays";
import { useSignal } from "../../hooks/use-signal";

export const UserRelaysTab = ({ pubkey }) => {
  const [events, setEvents] = useState({});

  useEffect(() => {
    if (pubkey) {
      subscribeToAuthor(pubkey);
    }
  }, [pubkey]);

  useSignal(
    onEvent,
    (event) => {
      if (event.body.kind === 1) {
        setEvents((dir) => ({ [event.body.id]: event.body, ...dir }));
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
