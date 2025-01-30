import { useEffect, useState } from "react";
import { Flex, Select } from "@chakra-ui/react";
import { Filter, NostrEvent } from "nostr-tools";
import { getReplaceableIdentifier, matchFilter } from "applesauce-core/helpers";
import { getEventUID } from "nostr-idb";
import { useThrottle } from "react-use";
import { createRxForwardReq } from "rx-nostr";

import BackButton from "../../../components/router/back-button";
import RelayList from "./components/relay-list";
import useRouteStateValue from "../../../hooks/use-route-state-value";
import RelayMap from "./components/relay-map";
import RelayStatusDetails from "./components/relay-details";
import { SelectedContext } from "./selected-context";
import CountyPicker from "../../../components/county-picker";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import rxNostr from "../../../services/rx-nostr";
import ContainedSimpleView from "../../../components/layout/presets/contained-simple-view";

export default function RelayDiscoveryView() {
  const showMap = useBreakpointValue({ base: false, lg: true });

  const [discoveryRelay, setDiscoveryRelay] = useState("wss://relay.nostr.watch");
  const [monitor, setMonitor] = useState("9bbbb845e5b6c831c29789900769843ab43bb5047abe697870cb50b6fc9bf923");
  const [network, setNetwork] = useState("");
  const [county, setCounty] = useState("");

  const selected = useRouteStateValue<string>("selected");
  const [events, setEvents] = useState<Record<string, NostrEvent>>({});

  const [request, setRequest] = useState<ReturnType<typeof createRxForwardReq>>();

  // recreate the subscription when the relay changes
  useEffect(() => {
    const req = createRxForwardReq();

    const sub = rxNostr.use(req, { on: { relays: [discoveryRelay] } }).subscribe((packet) => {
      if (getReplaceableIdentifier(packet.event)) {
        setEvents((arr) => ({ ...arr, [getEventUID(packet.event)]: packet.event }));
      }
    });

    setRequest(req);

    return () => sub.unsubscribe();
  }, [discoveryRelay, setEvents]);

  useEffect(() => {
    if (!request) return;

    const filter: Filter = {
      kinds: [30166],
      // set from https://github.com/nostr-protocol/nips/pull/230#pullrequestreview-2290873405
      since: Math.round(Date.now() / 1000) - 60 * 60 * 2,
    };

    if (monitor) filter.authors = [monitor];

    if (network) filter["#n"] = [network];
    if (county) {
      // if (filter["#L"]) filter["#L"].push("countryCode");
      // else filter["#L"] = ["countryCode"];

      if (filter["#l"]) filter["#l"].push(county);
      else filter["#l"] = [county];
    }

    request.emit([filter]);

    // remove non matching events
    setEvents((dir) => {
      const newDir: typeof dir = {};
      for (const [uid, event] of Object.entries(dir)) {
        if (matchFilter(filter, event)) newDir[uid] = event;
      }
      return newDir;
    });
  }, [request, monitor, network, county, setEvents]);

  // throttle updates to map
  const eventsThrottle = useThrottle(Object.values(events), 250);

  return (
    <SelectedContext.Provider value={selected}>
      <ContainedSimpleView
        title="Relays"
        flush
        actions={
          <>
            <Select value={network} onChange={(e) => setNetwork(e.target.value)} w="auto">
              <option value="">All</option>
              <option value="clearnet">clearnet</option>
              <option value="tor">Tor</option>
              <option value="i2p">I2P</option>
              <option value="hyper">Hyper</option>
            </Select>
            <CountyPicker value={county} onChange={(e) => setCounty(e.target.value)} w="auto" />
          </>
        }
      >
        <Flex gap="2" h="full" overflow="hidden" p="2">
          {selected.value && events[selected.value] ? (
            <RelayStatusDetails w={{ base: "full", lg: "lg" }} event={events[selected.value]} flexShrink={0} />
          ) : (
            <RelayList w={{ base: "full", lg: "lg" }} flexShrink={0} events={eventsThrottle} />
          )}
          {showMap && <RelayMap events={eventsThrottle} />}
        </Flex>
      </ContainedSimpleView>
    </SelectedContext.Provider>
  );
}
