import { useEventModel } from "applesauce-react/hooks";
import TrustedMintsQuery from "../models/trusted-mints";
import useReplaceableEvent from "./use-replaceable-event";
import { ProfilePointer } from "nostr-tools/nip19";

export default function useTrustedMints(user?: string | ProfilePointer) {
  return useEventModel(TrustedMintsQuery, user ? [user] : undefined);
}
