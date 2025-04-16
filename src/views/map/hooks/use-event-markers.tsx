import { useEffect, useRef } from "react";
import { NostrEvent } from "nostr-tools";
import L from "leaflet";
import ngeohash from "ngeohash";

import iconUrl from "../marker-icon.svg";
const pinIcon = L.icon({ iconUrl, iconSize: [32, 32], iconAnchor: [16, 32] });

export function getEventGeohash(event: NostrEvent) {
  let hash = "";
  for (const tag of event.tags) {
    if (tag[0] === "g" && tag[1] && tag[1].length > hash.length) {
      hash = tag[1];
    }
  }
  return hash || null;
}

export function getEventLatLng(event: NostrEvent): [number, number] | undefined {
  const geohash = getEventGeohash(event);
  if (!geohash) return;

  const latLng = ngeohash.decode(geohash);
  return [latLng.latitude, latLng.longitude];
}

export default function useEventMarkers(events: NostrEvent[], map?: L.Map, onClick?: (event: NostrEvent) => void) {
  const markers = useRef<Record<string, L.Marker>>({});

  // create markers
  useEffect(() => {
    for (const event of events) {
      const latLng = getEventLatLng(event);
      if (!latLng) continue;

      const marker = markers.current[event.id] || L.marker([0, 0], { icon: pinIcon });

      marker.setLatLng(latLng);

      if (onClick) marker.addEventListener("click", () => onClick(event));

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
      for (const [_id, marker] of Object.entries(markers.current)) {
        marker?.removeFrom(map);
      }
    };
  }, [map, events]);
}
