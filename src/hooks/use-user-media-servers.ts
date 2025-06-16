import { useEventModel } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { BlossomServersQuery } from "../models";

export default function useUsersMediaServers(pubkey?: string | ProfilePointer) {
  return useEventModel(BlossomServersQuery, pubkey ? [pubkey] : null);
}
