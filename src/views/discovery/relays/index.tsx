import { Flex, Select } from "@chakra-ui/react";
import { isReplaceable, matchFilter } from "applesauce-core/helpers";
import { onlyEvents } from "applesauce-relay";
import { getEventUID } from "nostr-idb";
import { Filter, NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";
import { useThrottle } from "react-use";

import CountyPicker from "../../../components/county-picker";
import SimpleView from "../../../components/layout/presets/simple-view";
import useRouteStateValue from "../../../hooks/use-route-state-value";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import pool from "../../../services/pool";
import RelayStatusDetails from "./components/relay-details";
import RelayList from "./components/relay-list";
import RelayMap from "./components/relay-map";
import { SelectedContext } from "./selected-context";

export default function RelayDiscoveryView() {
  const showMap = useBreakpointValue({ base: false, lg: true });

  const [discoveryRelay, _setDiscoveryRelay] = useState("wss://relay.nostr.watch");
  const [monitor, _setMonitor] = useState("9bbbb845e5b6c831c29789900769843ab43bb5047abe697870cb50b6fc9bf923");
  const [network, setNetwork] = useState("");
  const [county, setCounty] = useState("");

  const selected = useRouteStateValue<string>("selected");
  const [events, setEvents] = useState<Record<string, NostrEvent>>({});

  useEffect(() => {
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

    const sub = pool
      .subscription([discoveryRelay], filter)
      .pipe(onlyEvents())
      .subscribe((event) => {
        if (isReplaceable(event.kind)) {
          setEvents((arr) => ({ ...arr, [getEventUID(event)]: event }));
        }
      });

    // remove non matching events
    setEvents((dir) => {
      const newDir: typeof dir = {};
      for (const [uid, event] of Object.entries(dir)) {
        if (matchFilter(filter, event)) newDir[uid] = event;
      }
      return newDir;
    });

    return () => sub.unsubscribe();
  }, [monitor, network, county, setEvents, discoveryRelay]);

  // throttle updates to map
  const eventsThrottle = useThrottle(Object.values(events), 250);

  return (
    <SelectedContext.Provider value={selected}>
      <SimpleView
        title="Relays"
        flush
        scroll={false}
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
      </SimpleView>
    </SelectedContext.Provider>
  );
}
