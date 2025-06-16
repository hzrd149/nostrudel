import { useEventModel } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";

import { MutesQuery } from "../models/mutes";

export default function useUserMutes(pubkey?: string | ProfilePointer) {
  return useEventModel(MutesQuery, pubkey ? [pubkey] : undefined);
}
