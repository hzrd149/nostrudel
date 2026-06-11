import { use$ } from "applesauce-react/hooks";

import { RECOMMENDED_LOOKUP_RELAYS } from "../const";
import { lookupRelays$ } from "../services/lookup-relays";

/** Returns the resolved lookup relays for the active account (falls back to the recommended relays) */
export default function useLookupRelays(): string[] {
  return use$(lookupRelays$) ?? RECOMMENDED_LOOKUP_RELAYS;
}
