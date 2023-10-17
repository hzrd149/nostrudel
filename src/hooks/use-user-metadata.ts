import { useMemo } from "react";
import userMetadataService from "../services/user-metadata";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";
import { RequestOptions } from "../services/replaceable-event-requester";
import { COMMON_CONTACT_RELAY } from "../const";

export function useUserMetadata(pubkey: string, additionalRelays: string[] = [], opts: RequestOptions = {}) {
  const relays = useReadRelayUrls([...additionalRelays, COMMON_CONTACT_RELAY]);

  const subject = useMemo(() => userMetadataService.requestMetadata(pubkey, relays, opts), [pubkey, relays]);
  const metadata = useSubject(subject);

  return metadata;
}
