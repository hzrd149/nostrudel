import { memo, useCallback, useRef, useState } from "react";
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
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent, Relay, Subscription } from "nostr-tools";
import { useLocalStorage } from "react-use";
import { Subscription as IDBSubscription, CacheRelay } from "nostr-idb";
import _throttle from "lodash.throttle";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import BackButton from "../../../components/router/back-button";
import { localRelay } from "../../../services/local-relay";
import Play from "../../../components/icons/play";
import ClockRewind from "../../../components/icons/clock-rewind";
import HistoryDrawer from "./history-drawer";
import EventRow from "./event-row";
import { processFilter } from "./process";
import HelpModal from "./help-modal";
import HelpCircle from "../../../components/icons/help-circle";
import stringify from "json-stringify-deterministic";
import { DownloadIcon } from "../../../components/icons";
import { RelayUrlInput } from "../../../components/relay-url-input";
import { validateRelayURL } from "../../../helpers/relay";
import FilterEditor from "./filter-editor";

const EventTimeline = memo(({ events }: { events: NostrEvent[] }) => {
  return (
    <>
      {events.map((event) => (
        <EventRow key={event.id} event={event} />
      ))}
    </>
  );
});

export default function EventConsoleView() {
  const historyDrawer = useDisclosure();
  const [history, setHistory] = useLocalStorage<string[]>("console-history", []);
  const helpModal = useDisclosure();
  const queryRelay = useDisclosure();
  const [relayURL, setRelayURL] = useState("");
  const [relay, setRelay] = useState<Relay | null>(null);

  const [sub, setSub] = useState<Subscription | IDBSubscription | null>(null);

  const [query, setQuery] = useState(() => history?.[0] || JSON.stringify({ kinds: [1], limit: 20 }, null, 2));

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const loadEvents = useCallback(async () => {
    try {
      if (queryRelay.isOpen && !relayURL) throw new Error("Must set relay");

      const filter = await processFilter(JSON.parse(query));
      setLoading(true);
      setHistory((arr) => (arr ? (!arr.includes(query) ? [query, ...arr] : arr) : [query]));
      setEvents([]);

      if (sub) sub.close();

      let r: Relay | CacheRelay = localRelay;
      if (queryRelay.isOpen) {
        const url = validateRelayURL(relayURL);
        if (!relay || relay.url !== url.toString()) {
          if (relay) relay.close();
          r = new Relay(url.toString());
          await r.connect();
          setRelay(r);
        } else r = relay;
      } else {
        if (relay) {
          relay.close();
          setRelay(null);
        }
      }

      await new Promise<void>((res) => {
        let buffer: NostrEvent[] = [];
        const flush = _throttle(() => setEvents([...buffer]), 1000 / 10, { trailing: true });

        const s = r.subscribe([filter], {
          onevent: (e) => {
            buffer.push(e);
            flush();
          },
          oneose: () => {
            setEvents([...buffer]);
            res();
          },
        });
        setSub(s);
      });
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    }
    setLoading(false);
  }, [queryRelay.isOpen, query, relayURL, relay, sub]);

  const submitRef = useRef(loadEvents);
  submitRef.current = loadEvents;

  const submitCode = useCallback(() => submitRef.current(), []);

  const downloadEvents = () => {
    const lines = events.map((e) => stringify(e)).join("\n");
    const file = new File([lines], "events.json", { type: "application/jsonl" });
    const url = URL.createObjectURL(file);
    window.open(url, "_blank");
  };

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <BackButton size="sm" />
        <Heading size="md">Event Console</Heading>
        <Switch size="sm" checked={queryRelay.isOpen} onChange={queryRelay.onToggle}>
          Query Relay
        </Switch>
        {queryRelay.isOpen && (
          <RelayUrlInput
            size="sm"
            borderRadius="md"
            w="xs"
            value={relayURL}
            onChange={(e) => setRelayURL(e.target.value)}
          />
        )}
        <ButtonGroup ml="auto">
          <IconButton icon={<HelpCircle />} aria-label="Help" title="Help" size="sm" onClick={helpModal.onOpen} />
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

      <FilterEditor value={query} onChange={setQuery} onRun={submitCode} />

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
        {sub && (
          <Text color="green.500" ml="auto">
            Subscribed
          </Text>
        )}
        {events.length > 0 && (
          <IconButton
            aria-label="Download Events"
            title="Download Events"
            icon={<DownloadIcon />}
            onClick={downloadEvents}
            size="xs"
          />
        )}
      </Flex>
      <Box>
        <EventTimeline events={events} />
      </Box>

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

      <HelpModal isOpen={helpModal.isOpen} onClose={helpModal.onClose} />
    </VerticalPageLayout>
  );
}
