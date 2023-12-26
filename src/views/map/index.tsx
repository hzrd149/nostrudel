import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Flex } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import ngeohash from "ngeohash";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet.locatecontrol";

import useSubject from "../../hooks/use-subject";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";

import { debounce } from "../../helpers/function";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { NostrEvent } from "../../types/nostr-event";
import MapTimeline from "./timeline";

import iconUrl from "./marker-icon.svg";
import useRouteSearchValue from "../../hooks/use-route-search-value";
const pinIcon = L.icon({ iconUrl, iconSize: [32, 32], iconAnchor: [16, 32] });

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
function getEventGeohash(event: NostrEvent) {
  let hash = "";
  for (const tag of event.tags) {
    if (tag[0] === "g" && tag[1] && tag[1].length > hash.length) {
      hash = tag[1];
    }
  }
  return hash || null;
}

function useEventMarkers(events: NostrEvent[], map?: L.Map, onClick?: (event: NostrEvent) => void) {
  const markers = useRef<Record<string, L.Marker>>({});

  // create markers
  useEffect(() => {
    for (const event of events) {
      const geohash = getEventGeohash(event);
      if (!geohash) continue;

      const marker = markers.current[event.id] || L.marker([0, 0], { icon: pinIcon });

      const latLng = ngeohash.decode(geohash);
      marker.setLatLng([latLng.latitude, latLng.longitude]);

      if (onClick) {
        marker.addEventListener("click", () => onClick(event));
      }

      markers.current[event.id] = marker;
    }
  }, [events]);

  // add makers to map
  useEffect(() => {
    if (!map) return;

    const ids = events.map((e) => e.id);

    for (const [id, marker] of Object.entries(markers.current)) {
      if (ids.includes(id)) marker?.addTo(map);
      else marker?.remove();
    }

    return () => {
      for (const [id, marker] of Object.entries(markers.current)) {
        marker?.removeFrom(map);
      }
    };
  }, [map, events]);
}

export default function MapView() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<L.Map>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([39, -97], 4);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    L.control.locate().addTo(map);

    map.addEventListener(
      "move",
      debounce(() => {
        const center = map.getCenter();
        const hash = ngeohash.encode(center.lat, center.lng, 5);

        setSearchParams({ hash }, { replace: true });
      }, 1000),
    );

    setMap(map);

    return () => {
      setMap(undefined);
      map.remove();
    };
  }, []);

  const [cells, setCells] = useState<string[]>([]);

  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(
    "geo-events",
    readRelays,
    cells.length > 0 ? { "#g": cells, kinds: [Kind.Text] } : undefined,
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

  const events = useSubject(timeline.timeline);
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
          <MapTimeline timeline={timeline} focused={focused} />
          {cells.length > 0 && <TimelineActionAndStatus timeline={timeline} />}
        </Flex>
      </Flex>

      <Box w="full" ref={ref} h={{ base: "50vh", lg: "100vh" }} />
    </Flex>
  );
}
