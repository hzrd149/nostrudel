import { memo, useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  CloseButton,
  Flex,
  Heading,
} from "@chakra-ui/react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { jsonSchema } from "codemirror-json-schema";
import { Filter, NostrEvent } from "nostr-tools";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import BackButton from "../../../components/back-button";
import { NostrFilterSchema } from "./schema";
import { relayRequest } from "../../../helpers/relay";
import { localRelay } from "../../../services/local-relay";
import EmbeddedUnknown from "../../../components/embed-event/event-types/embedded-unknown";

const FilterEditor = memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  return (
    <ReactCodeMirror
      value={value}
      onChange={onChange}
      height="200px"
      lang="json"
      extensions={[jsonSchema(NostrFilterSchema)]}
    />
  );
});

const EventTimeline = memo(({ events }: { events: NostrEvent[] }) => {
  return (
    <>
      {events.map((event) => (
        <EmbeddedUnknown key={event.id} event={event} />
      ))}
    </>
  );
});

export default function QueryEventsView() {
  const [query, setQuery] = useState(
    () => localStorage.getItem("debug-query") || JSON.stringify({ kinds: [1], limit: 20 } satisfies Filter, null, 2),
  );

  useEffect(() => {
    localStorage.setItem("debug-query", query);
  }, [query]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const loadEvents = useCallback(async () => {
    try {
      const filter: Filter = JSON.parse(query);
      setLoading(true);
      const e = await relayRequest(localRelay, [filter]);
      setEvents(e);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    }
    setLoading(false);
  }, [query]);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <BackButton size="sm" />
        <Heading>Query Cache</Heading>
      </Flex>

      <FilterEditor value={query} onChange={setQuery} />
      <Flex gap="2">
        <Button colorScheme="primary" onClick={loadEvents} isLoading={loading}>
          Query
        </Button>
      </Flex>

      {error && (
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription whiteSpace="pre">{error}</AlertDescription>
          </Box>
          <CloseButton alignSelf="flex-start" position="relative" right={-1} top={-1} onClick={() => setError("")} />
        </Alert>
      )}

      <EventTimeline events={events} />
    </VerticalPageLayout>
  );
}
