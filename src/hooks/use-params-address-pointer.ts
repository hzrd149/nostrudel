import { useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";
import type { AddressPointer } from "nostr-tools/nip19";

import { CustomAddressPointer, parseCoordinate } from "../helpers/nostr/event";

export default function useParamsAddressPointer(key: string): AddressPointer;
export default function useParamsAddressPointer(key: string, requireD: true): AddressPointer;
export default function useParamsAddressPointer(key: string, requireD: false): CustomAddressPointer;
export default function useParamsAddressPointer(key: string, requireD: boolean = true): AddressPointer {
  const params = useParams();
  const value = params[key] as string;
  if (!value) throw new Error(`Missing ${key} in route`);

  if (value.includes(":")) {
    // v5: parseCoordinate signature changed, now only takes (value, requireIdentifier)
    const result = parseCoordinate(value, requireD);
    if (!result) throw new Error(`Invalid coordinate: ${value}`); // v5: can return null
    return result as AddressPointer;
  }

  // its not a coordinate, try to parse the nip19
  const pointer = nip19.decode(value as string);

  switch (pointer.type) {
    case "naddr":
      return pointer.data;
    default:
      throw new Error(`Unknown type ${pointer.type}`);
  }
}
