import { useEffect, useState } from "react";
import { Flex, Select } from "@chakra-ui/react";
import { Filter, matchFilters, NostrEvent } from "nostr-tools";
import { getEventUID } from "nostr-idb";
import { useThrottle } from "react-use";

import PersistentSubscription from "../../../classes/persistent-subscription";
import BackButton from "../../../components/router/back-button";
import relayPoolService from "../../../services/relay-pool";
import RelayList from "./components/relay-list";
import useRouteStateValue from "../../../hooks/use-route-state-value";
import RelayMap from "./components/relay-map";
import RelayStatusDetails from "./components/relay-details";
import { getTagValue, sortByDate } from "../../../helpers/nostr/event";
import { SelectedContext } from "./selected-context";
import CountyPicker from "../../../components/county-picker";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";

export default function RelayDiscoveryView() {
  const showMap = useBreakpointValue({ base: false, lg: true });

  const [discoveryRelay, setDiscoveryRelay] = useState("wss://history.nostr.watch/");
  const [monitor, setMonitor] = useState("9bbbb845e5b6c831c29789900769843ab43bb5047abe697870cb50b6fc9bf923");
  const [network, setNetwork] = useState("");
  const [county, setCounty] = useState("");

  const selected = useRouteStateValue<string>("selected");
  const [events, setEvents] = useState<Record<string, NostrEvent>>({});

  const [subscription, setSubscription] = useState<PersistentSubscription>();

  // recreate the subscription when the relay changes
  useEffect(() => {
    if (subscription && !subscription.closed) subscription.close();

    const relay = relayPoolService.requestRelay(discoveryRelay);
    const sub = new PersistentSubscription(relay, {
      onevent: (event) => {
        if (getTagValue(event, "d")) {
          setEvents((arr) => ({ ...arr, [getEventUID(event)]: event }));
        }
      },
    });
    setSubscription(sub);
  }, [discoveryRelay, setEvents]);

  useEffect(() => {
    if (!subscription) return;

    const filter: Filter = {
      authors: [monitor],
      kinds: [30166],
      // set from https://github.com/nostr-protocol/nips/pull/230#pullrequestreview-2290873405
      since: Math.round(Date.now() / 1000) - 60 * 60 * 2,
    };

    if (network) filter["#n"] = [network];
    if (county) {
      // if (filter["#L"]) filter["#L"].push("countryCode");
      // else filter["#L"] = ["countryCode"];

      if (filter["#l"]) filter["#l"].push(county);
      else filter["#l"] = [county];
    }

    subscription.filters = [filter];

    // remove non matching events
    setEvents((dir) => {
      const newDir: typeof dir = {};
      for (const [uid, event] of Object.entries(dir)) {
        if (matchFilters(subscription.filters, event)) newDir[uid] = event;
      }
      return newDir;
    });

    // update subscription
    subscription.update();
  }, [subscription, monitor, network, county, setEvents]);

  // throttle updates to map
  const eventsThrottle = useThrottle(Object.values(events), 250);

  return (
    <SelectedContext.Provider value={selected}>
      <Flex direction="column" overflow="hidden" h="100vh" gap="2" p="2">
        <Flex gap="2">
          <BackButton />
          <Select value={network} onChange={(e) => setNetwork(e.target.value)} w="auto">
            <option value="">All</option>
            <option value="clearnet">clearnet</option>
            <option value="tor">Tor</option>
            <option value="i2p">I2P</option>
          </Select>
          <CountyPicker value={county} onChange={(e) => setCounty(e.target.value)} w="auto" />
        </Flex>

        <Flex gap="2" overflow="hidden" h="full">
          {selected.value && events[selected.value] ? (
            <RelayStatusDetails w={{ base: "full", lg: "lg" }} event={events[selected.value]} flexShrink={0} />
          ) : (
            <RelayList w={{ base: "full", lg: "lg" }} flexShrink={0} events={eventsThrottle} />
          )}
          {showMap && <RelayMap events={eventsThrottle} />}
        </Flex>
      </Flex>
    </SelectedContext.Provider>
  );
}
