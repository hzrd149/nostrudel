import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Flex } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet.locatecontrol";
import ngeohash from "ngeohash";

import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";

import GenericNoteTimeline from "../../components/timeline-page/generic-note-timeline";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useSubject from "../../hooks/use-subject";
import { NostrEvent } from "../../types/nostr-event";

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

export default function MapView() {
  const ref = useRef<HTMLDivElement | null>(null);

  const [map, setMap] = useState<L.Map>();

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([39, -97], 4);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    L.control.locate().addTo(map);

    setMap(map);

    return () => {
      map.remove();
      setMap(undefined);
    };
  }, []);

  const [cells, setCells] = useState<string[]>([]);

  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(
    "geo-events",
    readRelays,
    { "#g": cells, kinds: [Kind.Text] },
    { enabled: cells.length > 0 }
  );

  const setCellsFromMap = useCallback(() => {
    if (!map) return;
    const bbox = map.getBounds();
    const hashes = ngeohash.bboxes(
      bbox.getSouth(),
      bbox.getWest(),
      bbox.getNorth(),
      bbox.getEast(),
      getPrecision(map.getZoom())
    );

    setCells(hashes);
  }, [map]);

  const events = useSubject(timeline.timeline);
  useEffect(() => {
    if (!map) return;

    const markers: L.Marker[] = [];
    for (const event of events) {
      const geohash = getEventGeohash(event);
      if (!geohash) continue;
      const latLng = ngeohash.decode(geohash);
      const marker = L.marker([latLng.latitude, latLng.longitude]).addTo(map);
      markers.push(marker);
    }

    return () => {
      for (const marker of markers) {
        marker.remove();
      }
    };
  }, [map, events]);

  return (
    <Flex overflow={{ lg: "hidden" }} h={{ lg: "full" }} direction={{ base: "column-reverse", lg: "row" }}>
      <Flex w={{ base: "full", lg: "xl" }} direction="column" p="2" gap="2">
        <Flex gap="2">
          <Button as={RouterLink} to="/" flexShrink={0}>
            Back
          </Button>
          <Button colorScheme="brand" onClick={setCellsFromMap} flex={1}>
            Search this area
          </Button>
        </Flex>

        <Flex overflowY="auto" overflowX="hidden" gap="2" direction="column" h="full">
          <GenericNoteTimeline timeline={timeline} />
          {cells.length > 0 && <TimelineActionAndStatus timeline={timeline} />}
        </Flex>
      </Flex>

      <Box w="full" ref={ref} h={{ base: "50vh", lg: "100vh" }} />
    </Flex>
  );
}
