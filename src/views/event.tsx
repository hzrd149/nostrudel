import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, Spinner } from "@chakra-ui/react";
import { Page } from "../components/page";
import { useParams } from "react-router-dom";
import { normalizeToHex } from "../helpers/nip-19";
import { Post } from "../components/post";
import { useThreadLoader } from "../hooks/use-thread-loader";

export const EventPage = () => {
  const params = useParams();
  let id = normalizeToHex(params.id ?? "");

  if (!id) {
    return (
      <Page>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Invalid event id</AlertTitle>
          <AlertDescription>"{params.id}" dose not look like a valid event id</AlertDescription>
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
  eventId: string;
};

export const EventView = ({ eventId }: EventViewProps) => {
  const id = normalizeToHex(eventId) ?? "";
  const { linked, events, rootId, focusId, loading } = useThreadLoader(id, { enabled: !!id });

  if (loading) return <Spinner />;

  const entry = linked.get(focusId);
  if (entry) {
    const isRoot = rootId === focusId;

    return (
      <Flex direction="column" gap="4">
        {!isRoot && (entry.root ? <Post event={entry.root.event} /> : <span>Missing Root</span>)}
        <Post event={entry.event} />
      </Flex>
    );
  } else if (events[focusId]) {
    return <Post event={events[focusId]} />;
  }
  return <span>Missing Event</span>;
};
