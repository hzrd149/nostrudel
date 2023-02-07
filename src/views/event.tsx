import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Flex,
} from "@chakra-ui/react";
import useSubject from "../hooks/use-subject";
import settings from "../services/settings";
import { Page } from "../components/page";
import { useParams } from "react-router-dom";
import { normalizeToHex } from "../helpers/nip-19";
import { Post } from "../components/post";
import eventsService from "../services/events";
import { useMemo } from "react";

export const EventPage = () => {
  const params = useParams();
  let id = normalizeToHex(params.id ?? "");

  if (!id) {
    return (
      <Page>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Invalid event id</AlertTitle>
          <AlertDescription>
            "{params.id}" dose not look like a valid event id
          </AlertDescription>
        </Alert>
      </Page>
    );
  }

  return (
    <Page>
      <EventView eventId={id} />
    </Page>
  );
};

function useEvent(id: string, relays: string[]) {
  const sub = useMemo(() => eventsService.requestEvent(id, relays), [id]);
  const event = useSubject(sub);

  return event;
}

export type EventViewProps = {
  /** id of event in hex format */
  eventId: string;
};

export const EventView = ({ eventId }: EventViewProps) => {
  const relays = useSubject(settings.relays);

  const event = useEvent(eventId, relays);

  // const replySub = useSubscription(relays, { "#e": [eventId], kinds: [1] });
  // const { events } = useEventDir(replySub);

  // const timeline = Object.values(events).sort(
  //   (a, b) => b.created_at - a.created_at
  // );

  return (
    <Flex direction="column" gap="2" flexGrow="1" overflow="auto">
      {event && <Post event={event} />}
      {/* {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))} */}
    </Flex>
  );
};
