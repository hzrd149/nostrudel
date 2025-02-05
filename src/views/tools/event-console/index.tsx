import { memo, useCallback, useEffect, useRef, useState } from "react";
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
  IconButton,
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useLocalStorage } from "react-use";
import _throttle from "lodash.throttle";
import stringify from "json-stringify-deterministic";
import { useLocation, useSearchParams } from "react-router-dom";
import { safeParse } from "applesauce-core/helpers/json";
import { createRxForwardReq, EventPacket } from "rx-nostr";
import { Subscription } from "rxjs";

import Play from "../../../components/icons/play";
import ClockRewind from "../../../components/icons/clock-rewind";
import HistoryDrawer from "./history-drawer";
import EventRow from "./event-row";
import { processFilter } from "./process";
import HelpModal from "./help-modal";
import HelpCircle from "../../../components/icons/help-circle";
import { DownloadIcon, ShareIcon } from "../../../components/icons";
import { RelayUrlInput } from "../../../components/relay-url-input";
import FilterEditor from "./filter-editor";
import useCacheRelay from "../../../hooks/use-cache-relay";
import SimpleView from "../../../components/layout/presets/simple-view";
import { cacheRequest } from "../../../services/cache-relay";
import { eventStore } from "../../../services/event-store";
import rxNostr from "../../../services/rx-nostr";

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
  const cacheRelay = useCacheRelay();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const historyDrawer = useDisclosure();
  const [history, setHistory] = useLocalStorage<string[]>("console-history", []);
  const helpModal = useDisclosure();
  const queryRelay = useDisclosure({ defaultIsOpen: params.has("relay") });
  const [relay, setRelay] = useState(params.get("relay") || "");

  const [sub, setSub] = useState<Subscription | null>(null);

  const [query, setQuery] = useState(() => {
    if (params.has("filter") || location.state?.filter) {
      const str = params.get("filter");
      if (str) {
        const f = safeParse(str);
        if (f) return JSON.stringify(f, null, 2);
      } else if (typeof location.state.filter === "object") {
        return JSON.stringify(location.state.filter, null, 2);
      }
    }
    if (history?.[0]) return history?.[0];
    return JSON.stringify({ kinds: [1], limit: 20 }, null, 2);
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const loadEvents = useCallback(async () => {
    try {
      const filter = await processFilter(JSON.parse(query));
      setLoading(true);
      setHistory((arr) => (arr ? (!arr.includes(query) ? [query, ...arr] : arr) : [query]));
      setEvents([]);
      setError("");

      // stop previous subscription
      if (sub) sub.unsubscribe();

      const buffer: NostrEvent[] = [];
      const flush = _throttle(
        () => {
          setEvents([...buffer]);
        },
        1000 / 10,
        { trailing: true },
      );

      const handleEvent = (event: NostrEvent) => {
        event = eventStore.add(event);
        buffer.push(event);
        flush();
      };
      const handleEventPacket = (packet: EventPacket) => {
        const event = eventStore.add(packet.event, packet.from);
        buffer.push(event);
        flush();
      };

      if (queryRelay.isOpen) {
        if (!relay) throw new Error("Must set relay");

        // query remote relay
        const req = createRxForwardReq();
        const sub = rxNostr.use(req, { on: { relays: [relay] } }).subscribe(handleEventPacket);
        req.emit([filter]);
        setSub(sub);
      } else {
        // query cache relay
        if (!cacheRelay) throw new Error("Local relay disabled");
        const sub = cacheRequest([filter]).subscribe(handleEvent);
        setSub(sub);
      }
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    }
    setLoading(false);
  }, [queryRelay.isOpen, query, relay, relay, sub, cacheRelay]);

  const submitRef = useRef(loadEvents);
  submitRef.current = loadEvents;

  const submitCode = useCallback(() => submitRef.current(), []);

  const downloadEvents = () => {
    const lines = events.map((e) => stringify(e)).join("\n");
    const file = new File([lines], "events.json", { type: "application/jsonl" });
    const url = URL.createObjectURL(file);
    window.open(url, "_blank");
  };

  const updateSharedURL = () => {
    const p = new URLSearchParams(params);
    p.set("filter", query);
    if (relay) p.set("relay", relay);
    setParams(p, { replace: true });
  };

  return (
    <SimpleView
      title="Event Console"
      actions={
        <>
          <ButtonGroup ml="auto">
            <IconButton icon={<HelpCircle />} aria-label="Help" title="Help" size="sm" onClick={helpModal.onOpen} />
            <IconButton icon={<ShareIcon />} aria-label="Share" size="sm" onClick={updateSharedURL} />
            <IconButton
              icon={<ClockRewind />}
              aria-label="History"
              title="History"
              size="sm"
              onClick={historyDrawer.onOpen}
            />
          </ButtonGroup>
        </>
      }
    >
      <Flex gap="2" wrap="wrap" alignItems="center">
        <Switch size="sm" isChecked={queryRelay.isOpen} onChange={queryRelay.onToggle}>
          Query Relay
        </Switch>
        {queryRelay.isOpen && (
          <RelayUrlInput size="sm" borderRadius="md" w="xs" value={relay} onChange={(e) => setRelay(e.target.value)} />
        )}
      </Flex>
      <FilterEditor value={query} onChange={setQuery} onRun={submitCode} />

      <Flex gap="2" alignItems="center">
        <Text>{events.length} events</Text>
        {sub && <Text color="green.500">Subscribed</Text>}
        <ButtonGroup ms="auto" size="sm">
          {events.length > 0 && (
            <IconButton
              aria-label="Download Events"
              title="Download Events"
              icon={<DownloadIcon />}
              onClick={downloadEvents}
            />
          )}
          <Button colorScheme="primary" onClick={loadEvents} isLoading={loading} leftIcon={<Play />}>
            Run
          </Button>
        </ButtonGroup>
      </Flex>

      {error && (
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription whiteSpace="pre">{error}</AlertDescription>
          </Box>
          <CloseButton
            alignSelf="flex-start"
            position="relative"
            right={-1}
            top={-1}
            onClick={() => setError("")}
            ml="auto"
          />
        </Alert>
      )}

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
    </SimpleView>
  );
}
