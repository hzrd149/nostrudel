import { ContactsModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";

export default function useUserContacts(pubkey?: string | ProfilePointer) {
  return useEventModel(ContactsModel, pubkey ? [pubkey] : undefined);
}
