import { AppHandler } from "applesauce-common/casts";
import { use$ } from "applesauce-react/hooks";
import type { AddressPointer } from "nostr-tools/nip19";

import useCastEvent from "./use-cast-event";
import useReplaceableEvent from "./use-replaceable-event";

/** Returns the DVM's handler metadata, falling back to the author's profile when the handler has none */
export default function useDVMMetadata(pointer: AddressPointer) {
  const handler = useCastEvent(useReplaceableEvent(pointer), AppHandler);
  return use$(handler?.metadata$);
}
