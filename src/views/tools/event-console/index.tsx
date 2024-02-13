import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  ButtonGroup,
  CloseButton,
  Flex,
  Heading,
  Text,
} from "@chakra-ui/react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { jsonSchema } from "codemirror-json-schema";
import { Filter, NostrEvent } from "nostr-tools";
import { keymap } from "@codemirror/view";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import BackButton from "../../../components/back-button";
import { NostrFilterSchema } from "./schema";
import { relayRequest } from "../../../helpers/relay";
import { localRelay } from "../../../services/local-relay";
import EmbeddedUnknown from "../../../components/embed-event/event-types/embedded-unknown";
import Play from "../../../components/icons/play";

const FilterEditor = memo(
  ({ value, onChange, onRun }: { value: string; onChange: (v: string) => void; onRun: () => void }) => {
    const extensions = useMemo(
      () => [
        keymap.of([
          {
            win: "Ctrl-Enter",
            linux: "Ctrl-Enter",
            mac: "Cmd-Enter",
            preventDefault: true,
            run: () => {
              onRun();
              return true;
            },
            shift: () => {
              onRun();
              return true;
            },
          },
        ]),
        jsonSchema(NostrFilterSchema),
      ],
      [onRun],
    );
    return <ReactCodeMirror value={value} onChange={onChange} height="200px" lang="json" extensions={extensions} />;
  },
);

const EventTimeline = memo(({ events }: { events: NostrEvent[] }) => {
  return (
    <>
      {events.map((event) => (
        <EmbeddedUnknown key={event.id} event={event} />
      ))}
    </>
  );
});

export default function EventConsoleView() {
  const [query, setQuery] = useState(
    () => localStorage.getItem("debug-query") || JSON.stringify({ kinds: [1], limit: 20 }, null, 2),
  );
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    localStorage.setItem("debug-query", query);
  }, [query]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const loadEvents = useCallback(async () => {
    try {
      const filter: Filter = JSON.parse(queryRef.current);
      setLoading(true);
      const e = await relayRequest(localRelay, [filter]);
      setEvents(e);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    }
    setLoading(false);
  }, []);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <BackButton size="sm" />
        <Heading size="lg">Event Console</Heading>
        <ButtonGroup ml="auto">
          <Button colorScheme="primary" onClick={loadEvents} isLoading={loading} leftIcon={<Play />} size="sm">
            Run
          </Button>
        </ButtonGroup>
      </Flex>

      <FilterEditor value={query} onChange={setQuery} onRun={loadEvents} />

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

      <Flex gap="2">
        <Text>{events.length} events</Text>
      </Flex>
      <EventTimeline events={events} />
    </VerticalPageLayout>
  );
}
