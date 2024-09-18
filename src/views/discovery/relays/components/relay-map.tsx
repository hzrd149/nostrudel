import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { BoxProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import L from "leaflet";

import LeafletMap from "../../../map/components/leaflet-map";
import useEventMarkers, { getEventLatLng } from "../../../map/hooks/use-event-markers";
import { getEventUID } from "../../../../helpers/nostr/event";
import { SelectedContext } from "../selected-context";

export default function RelayMap({ events, ...props }: Omit<BoxProps, "children"> & { events: NostrEvent[] }) {
  const [map, setMap] = useState<L.Map>();

  const selected = useContext(SelectedContext);
  const prev = useRef(selected.value);

  const selectRelay = useCallback(
    (event: NostrEvent) => {
      const id = getEventUID(event);
      if (prev.current !== id) {
        prev.current = id;
        selected.setValue(id);
      }
    },
    [selected.setValue],
  );

  useEventMarkers(events, map, selectRelay);

  const eventsRef = useRef(events);
  eventsRef.current = events;

  // center map when selected changes
  useEffect(() => {
    if (!map || selected.value === prev.current) return;

    const selectedEvent = eventsRef.current.find((e) => getEventUID(e) === selected.value);

    if (selectedEvent) {
      const latLng = getEventLatLng(selectedEvent);
      if (latLng) map.setView(latLng, 10);
    }
  }, [map, selected.value]);

  return <LeafletMap onCreate={setMap} {...props} />;
}
