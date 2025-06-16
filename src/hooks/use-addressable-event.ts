import { useEventModel } from "applesauce-react/hooks";

import { CustomAddressPointer } from "../helpers/nostr/event";
import { AddressableQuery } from "../models";

export default function useAddressableEvent(address: CustomAddressPointer | undefined) {
  return useEventModel(AddressableQuery, address ? [address] : undefined);
}
