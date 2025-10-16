import { ReplaceableModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";

import { CustomAddressPointer } from "../helpers/nostr/event";

export default function useAddressableEvent(address: CustomAddressPointer | undefined) {
  return useEventModel(ReplaceableModel, address ? [address] : undefined);
}
