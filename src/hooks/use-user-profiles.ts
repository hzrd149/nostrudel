import { useEventModel } from "applesauce-react/hooks";
import { UserProfilesQuery } from "../models";

export default function useUserProfiles(pubkeys?: string[]) {
  return useEventModel(UserProfilesQuery, pubkeys && [pubkeys]);
}
