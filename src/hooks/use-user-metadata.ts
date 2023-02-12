import { useMemo } from "react";
import { unique } from "../helpers/array";
import userMetadataService from "../services/user-metadata";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export function useUserMetadata(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const clientRelays = useReadRelayUrls();
  const relays = useMemo(() => unique(clientRelays.concat(additionalRelays)), [additionalRelays.join(",")]);

  const subject = useMemo(
    () => userMetadataService.requestMetadata(pubkey, relays, alwaysRequest),
    [pubkey, relays, alwaysRequest]
  );
  const metadata = useSubject(subject);

  return metadata;
}
