import { useMemo } from "react";
import userMetadataService from "../services/user-metadata";
import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";
import { RequestOptions } from "../services/replaceable-events";
import { COMMON_CONTACT_RELAY } from "../const";

export default function useUserMetadata(
  pubkey?: string,
  additionalRelays: Iterable<string> = [],
  opts: RequestOptions = {},
) {
  const readRelays = useReadRelays([...additionalRelays, COMMON_CONTACT_RELAY]);

  const subject = useMemo(
    () => (pubkey ? userMetadataService.requestMetadata(pubkey, readRelays, opts) : undefined),
    [pubkey, readRelays],
  );
  const metadata = useSubject(subject);

  return metadata;
}
