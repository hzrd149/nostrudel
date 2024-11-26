import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Flex } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import ngeohash from "ngeohash";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet.locatecontrol";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";

import { debounce } from "../../helpers/function";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import { NostrEvent } from "../../types/nostr-event";
import MapTimeline from "./timeline";

import useEventMarkers from "./hooks/use-event-markers";
import LeafletMap from "./components/leaflet-map";

function getPrecision(zoom: number) {
  if (zoom <= 4) return 1;
  if (zoom <= 8) return 2;
  if (zoom <= 10) return 3;
  if (zoom <= 12) return 4;
  if (zoom <= 14) return 5;
  if (zoom <= 16) return 6;
  if (zoom <= 18) return 7;
  return 7;
}

export default function MapView() {
  const navigate = useNavigate();
  const [map, setMap] = useState<L.Map>();
  const [searchParams, setSearchParams] = useSearchParams();

  // listen for map move event
  useEffect(() => {
    if (!map) return;

    const listener = debounce(() => {
      const center = map.getCenter();
      const hash = ngeohash.encode(center.lat, center.lng, 5);

      setSearchParams({ hash }, { replace: true });
    }, 1000);

    map.addEventListener("move", listener);
    return () => {
      map.removeEventListener("move", listener);
    };
  });

  const [cells, setCells] = useState<string[]>([]);

  const readRelays = useReadRelays();
  const { loader, timeline } = useTimelineLoader(
    "geo-events",
    readRelays,
    cells.length > 0 ? { "#g": cells, kinds: [kinds.ShortTextNote] } : undefined,
  );

  const setCellsFromMap = useCallback(() => {
    if (!map) return;
    const bbox = map.getBounds();
    const hashes = ngeohash.bboxes(
      bbox.getSouth(),
      bbox.getWest(),
      bbox.getNorth(),
      bbox.getEast(),
      getPrecision(map.getZoom()),
    );

    setCells(hashes);
  }, [map]);

  const [focused, setFocused] = useState<string>();
  const handleMarkerClick = useCallback((event: NostrEvent) => {
    document.querySelector(`[data-event-id="${event.id}"]`)?.scrollIntoView();
    setFocused(event.id);
  }, []);

  const events = useObservable(loader.timeline) ?? [];
  useEventMarkers(events, map, handleMarkerClick);

  return (
    <Flex overflow={{ lg: "hidden" }} h={{ lg: "full" }} direction={{ base: "column-reverse", lg: "row" }}>
      <Flex w={{ base: "full", lg: "xl" }} direction="column" p="2" gap="2">
        <Flex gap="2">
          <Button flexShrink={0} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button colorScheme="primary" onClick={setCellsFromMap} flex={1}>
            Search this area
          </Button>
        </Flex>

        <Flex overflowY="auto" overflowX="hidden" gap="2" direction="column" h="full">
          <MapTimeline timeline={loader} focused={focused} />
          {cells.length > 0 && <TimelineActionAndStatus timeline={loader} />}
        </Flex>
      </Flex>

      <LeafletMap onCreate={setMap} h={{ base: "50vh", lg: "100vh" }} />
    </Flex>
  );
}
