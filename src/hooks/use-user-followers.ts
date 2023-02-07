import { useMemo } from "react";
import userFollowersService from "../services/user-followers";
import useSubject from "./use-subject";

export function useUserFollowers(pubkey: string, relays: string[] = [], alwaysRequest = false) {
  const observable = useMemo(
    () => userFollowersService.requestFollowers(pubkey, relays, alwaysRequest),
    [pubkey, alwaysRequest]
  );
  const followers = useSubject(observable) ?? undefined;

  return followers;
}
