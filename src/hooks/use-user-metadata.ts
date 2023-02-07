import { useMemo } from "react";
import userMetadataService from "../services/user-metadata";
import useSubject from "./use-subject";

export function useUserMetadata(pubkey: string, relays: string[] = [], alwaysRequest = false) {
  const observable = useMemo(() => userMetadataService.requestMetadata(pubkey, relays, alwaysRequest), [pubkey]);
  const metadata = useSubject(observable) ?? undefined;

  return metadata;
}
