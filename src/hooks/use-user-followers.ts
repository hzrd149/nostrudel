import { useMemo } from "react";
import userFollowersService from "../services/user-followers";
import useSubject from "./use-subject";

export function useUserFollowers(pubkey: string, relays: string[] = [], alwaysRequest = false) {
  const subject = useMemo(
    () => userFollowersService.requestFollowers(pubkey, relays, alwaysRequest),
    [pubkey, alwaysRequest]
  );
  const followers = useSubject(subject) ?? undefined;

  return followers;
}
