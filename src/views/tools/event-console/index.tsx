import { memo, useCallback, useMemo, useRef, useState } from "react";
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
  IconButton,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { jsonSchema } from "codemirror-json-schema";
import { Filter, NostrEvent } from "nostr-tools";
import { keymap } from "@codemirror/view";
import { useLocalStorage } from "react-use";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import BackButton from "../../../components/back-button";
import { NostrFilterSchema } from "./schema";
import { relayRequest } from "../../../helpers/relay";
import { localRelay } from "../../../services/local-relay";
import EmbeddedUnknown from "../../../components/embed-event/event-types/embedded-unknown";
import Play from "../../../components/icons/play";
import ClockRewind from "../../../components/icons/clock-rewind";
import HistoryDrawer from "./history-drawer";

const FilterEditor = memo(
  ({ value, onChange, onRun }: { value: string; onChange: (v: string) => void; onRun: () => void }) => {
    const { colorMode } = useColorMode();
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
    return (
      <ReactCodeMirror
        value={value}
        onChange={onChange}
        height="200px"
        lang="json"
        extensions={extensions}
        theme={colorMode === "light" ? githubLight : githubDark}
      />
    );
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
  const historyDrawer = useDisclosure();
  const [history, setHistory] = useLocalStorage<string[]>("console-history", []);

  const [query, setQuery] = useState(() => history?.[0] || JSON.stringify({ kinds: [1], limit: 20 }, null, 2));
  const queryRef = useRef(query);
  queryRef.current = query;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const loadEvents = useCallback(async () => {
    try {
      const filter: Filter = JSON.parse(queryRef.current);
      setLoading(true);
      setHistory((arr) => (arr || []).concat(queryRef.current));
      const e = await relayRequest(localRelay, [filter]);
      setEvents(e);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    }
    setLoading(false);
  }, []);

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center">
        <BackButton size="sm" />
        <Heading size="md">Event Console</Heading>
        <ButtonGroup ml="auto">
          <IconButton
            icon={<ClockRewind />}
            aria-label="History"
            title="History"
            size="sm"
            onClick={historyDrawer.onOpen}
          />
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

      <HistoryDrawer
        isOpen={historyDrawer.isOpen}
        onClose={historyDrawer.onClose}
        history={history || []}
        onClear={() => setHistory([])}
        onSelect={(v) => {
          setQuery(v);
          historyDrawer.onClose();
        }}
      />
    </VerticalPageLayout>
  );
}
