import { useReadRelayUrls } from "./use-client-relays";
import { useMemo } from "react";
import replaceableEventLoaderService, { RequestOptions } from "../services/replaceable-event-requester";
import { CustomEventPointer, parseCoordinate } from "../helpers/nostr/events";
import useSubject from "./use-subject";

export default function useReplaceableEvent(
  cord: string | CustomEventPointer | undefined,
  additionalRelays: string[] = [],
  opts: RequestOptions = {},
) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const sub = useMemo(() => {
    const parsed = typeof cord === "string" ? parseCoordinate(cord) : cord;
    if (!parsed) return;
    return replaceableEventLoaderService.requestEvent(
      parsed.relays ? [...readRelays, ...parsed.relays] : readRelays,
      parsed.kind,
      parsed.pubkey,
      parsed.identifier,
      opts,
    );
  }, [cord, readRelays.join("|"), opts?.alwaysRequest, opts?.ignoreCache]);

  return useSubject(sub);
}
