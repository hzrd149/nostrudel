import { useEventModel } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { ProfileQuery } from "../models";

export default function useUserProfile(pubkey?: string | ProfilePointer) {
  return useEventModel(ProfileQuery, pubkey ? [pubkey] : undefined);
}
