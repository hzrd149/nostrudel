import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Flex,
} from "@chakra-ui/react";
import useSubject from "../hooks/use-subject";
import settings from "../services/settings";
import { useSubscription } from "../hooks/use-subscription";
import { Page } from "../components/page";
import { useParams } from "react-router-dom";
import { normalizeToHex } from "../helpers/nip-19";
import { Post } from "../components/post";
import { useEventDir } from "../hooks/use-event-dir";

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

export type EventViewProps = {
  /** id of event in hex format */
  eventId: string;
};

export const EventView = ({ eventId }: EventViewProps) => {
  const relays = useSubject(settings.relays);

  const eventSub = useSubscription(relays, { ids: [eventId] });
  const event = useSubject(eventSub.onEvent);

  const replySub = useSubscription(relays, { "#e": [eventId] });
  const { events } = useEventDir(replySub);

  const timeline = Object.values(events).sort(
    (a, b) => b.created_at - a.created_at
  );

  return (
    <Flex direction="column" gap="2" flexGrow="1" overflow="auto">
      {event && <Post event={event} />}
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </Flex>
  );
};
