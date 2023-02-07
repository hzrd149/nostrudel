import { useMemo } from "react";
import userMetadataService from "../services/user-metadata";
import useSubject from "./use-subject";

export function useUserMetadata(pubkey: string, relays: string[] = [], alwaysRequest = false) {
  const subject = useMemo(() => userMetadataService.requestMetadata(pubkey, relays), [pubkey, alwaysRequest]);
  const metadata = useSubject(subject) ?? undefined;

  return metadata;
}
