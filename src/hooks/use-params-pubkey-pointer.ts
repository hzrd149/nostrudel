import { useParams } from "react-router";
import { nip19 } from "nostr-tools";
import type { ProfilePointer } from "nostr-tools/nip19";
import { isHexKey } from "../helpers/nip19";

export default function useParamsProfilePointer(key: string = "pubkey"): ProfilePointer {
  const params = useParams();
  const value = params[key] as string;
  if (!value) throw new Error(`Missing ${key} in route`);

  if (isHexKey(value)) return { pubkey: value, relays: [] };
  const pointer = nip19.decode(value);

  switch (pointer.type) {
    case "npub":
      return { pubkey: pointer.data as string, relays: [] };
    case "nprofile":
      return pointer.data;
    default:
      throw new Error(`Unknown type ${pointer.type}`);
  }
}
