import { ProfileModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";

export default function useUserProfile(pubkey?: string | ProfilePointer) {
  return useEventModel(ProfileModel, pubkey ? [pubkey] : undefined);
}
