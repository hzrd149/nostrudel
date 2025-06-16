import { useEventModel } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { ProfileBadgesQuery } from "../models/badges";

export default function useUserProfileBadges(user?: ProfilePointer) {
  return useEventModel(ProfileBadgesQuery, user ? [user] : undefined);
}
