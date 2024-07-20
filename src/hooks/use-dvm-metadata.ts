import { useMemo } from "react";
import type { AddressPointer } from "nostr-tools/nip19";

import useReplaceableEvent from "./use-replaceable-event";
import { parseDVMMetadata } from "../helpers/nostr/dvm";

export default function useDVMMetadata(pointer: AddressPointer) {
  const appMetadataEvent = useReplaceableEvent(pointer);
  return useMemo(() => appMetadataEvent && parseDVMMetadata(appMetadataEvent), [appMetadataEvent]);
}
