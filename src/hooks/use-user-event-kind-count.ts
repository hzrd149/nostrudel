import useEventCount from "./use-event-count";

export default function useUserEventKindCount(pubkey: string, kind: number) {
  return useEventCount({ authors: [pubkey], kinds: [kind] });
}
