import {
  AddressPointer,
  AddressPointerWithoutD,
  EventPointer,
  isEventPointer,
  parseCoordinate,
} from "applesauce-core/helpers";
import { useEventStore, useObservableEagerMemo } from "applesauce-react/hooks";
import hash_sum from "hash-sum";

export default function useEvent(pointer?: string | EventPointer | AddressPointer | AddressPointerWithoutD) {
  const eventStore = useEventStore();

  return useObservableEagerMemo(() => {
    if (!pointer) return;

    if (typeof pointer === "string") {
      if (pointer.includes(":")) {
        const coordinate = parseCoordinate(pointer);
        if (!coordinate) return;
        return eventStore.replaceable(coordinate);
      } else return eventStore.event(pointer);
    } else if (isEventPointer(pointer)) return eventStore.event(pointer);
    else return eventStore.replaceable(pointer);
  }, [hash_sum(pointer), eventStore]);
}
