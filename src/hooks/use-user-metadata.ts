import { useMemo } from "react";
import userMetadataService from "../services/user-metadata";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";
import { RequestOptions } from "../services/replaceable-event-requester";

export function useUserMetadata(pubkey: string, additionalRelays: string[] = [], opts: RequestOptions = {}) {
  const relays = useReadRelayUrls([...additionalRelays, "wss://purplepag.es"]);

  const subject = useMemo(() => userMetadataService.requestMetadata(pubkey, relays, opts), [pubkey, relays]);
  const metadata = useSubject(subject);

  return metadata;
}
