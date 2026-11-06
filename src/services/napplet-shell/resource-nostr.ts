import { nip19 } from "nostr-tools";
import { filter, firstValueFrom, fromEvent, takeUntil, timeout } from "rxjs";
import { eventStore } from "../event-store";

export async function loadNostrResource(reference: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const pointer = nip19.decode(reference);
  if (!["note", "nevent", "naddr"].includes(pointer.type)) throw new Error("Expected a Nostr event reference");
  const target =
    pointer.type === "note"
      ? pointer.data
      : pointer.type === "nevent" || pointer.type === "naddr"
        ? pointer.data
        : undefined;
  if (!target) return undefined;
  return firstValueFrom(
    eventStore.event(target).pipe(
      filter((event) => !!event),
      takeUntil(fromEvent(signal, "abort")),
      timeout(15000),
    ),
    { defaultValue: undefined },
  );
}
