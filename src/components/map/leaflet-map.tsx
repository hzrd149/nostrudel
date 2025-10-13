import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet.locatecontrol";

export type EventMapProps = Omit<BoxProps, "children"> & {
  onMove?: (map: L.Map) => void;
  onCreate?: (map: L.Map) => void;
  mapRef?: MutableRefObject<L.Map>;
};

export default function LeafletMap({ onMove, mapRef, onCreate, ...props }: EventMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [_map, setMap] = useState<L.Map>();

  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([39, -97], 4);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    L.control.locate().addTo(map);

    map.addEventListener("move", () => {
      if (onMoveRef.current) onMoveRef.current(map);
    });

    setMap(map);

    if (mapRef) mapRef.current = map;
    if (onCreate) onCreate(map);

    return () => {
      setMap(undefined);
      map.remove();
    };
  }, []);

  return <Box w="full" ref={ref} {...props} />;
}
