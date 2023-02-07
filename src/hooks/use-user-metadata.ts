import { useMemo } from "react";
import { useObservable } from "react-use";
import userMetadataService from "../services/user-metadata";

export function useUserMetadata(pubkey: string, relays?: string[], alwaysRequest = false) {
  const observable = useMemo(() => userMetadataService.requestMetadata(pubkey, relays, alwaysRequest), [pubkey]);
  const metadata = useObservable(observable) ?? undefined;

  return metadata;
}
