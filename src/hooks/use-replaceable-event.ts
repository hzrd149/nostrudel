import { useReadRelayUrls } from "./use-client-relays";
import { useMemo } from "react";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import { ParsedCoordinate, parseCoordinate } from "../helpers/nostr/events";
import useSubject from "./use-subject";

export default function useReplaceableEvent(cord: string | ParsedCoordinate, additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const sub = useMemo(() => {
    const parsed = typeof cord === "string" ? parseCoordinate(cord) : cord;
    if (!parsed) return;
    return replaceableEventLoaderService.requestEvent(
      parsed.relays ? [...readRelays, ...parsed.relays] : readRelays,
      parsed.kind,
      parsed.pubkey,
      parsed.identifier,
    );
  }, [cord, readRelays.join("|")]);

  return useSubject(sub);
}
