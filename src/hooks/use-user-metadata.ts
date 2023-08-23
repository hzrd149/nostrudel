import { useMemo } from "react";
import userMetadataService from "../services/user-metadata";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export function useUserMetadata(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const relays = useReadRelayUrls(additionalRelays);

  const subject = useMemo(
    () => userMetadataService.requestMetadata(pubkey, relays, alwaysRequest),
    [pubkey, relays, alwaysRequest],
  );
  const metadata = useSubject(subject);

  return metadata;
}
