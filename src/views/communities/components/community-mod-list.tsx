import { AvatarGroup, AvatarGroupProps } from "@chakra-ui/react";

import { UserAvatarLink } from "../../../components/user-avatar-link";
import { NostrEvent } from "../../../types/nostr-event";
import { getCommunityMods } from "../../../helpers/nostr/communities";

export default function CommunityModList({
  community,
  ...props
}: Omit<AvatarGroupProps, "children"> & { community: NostrEvent }) {
  const mods = getCommunityMods(community);

  return (
    <AvatarGroup {...props}>
      {mods.map((pubkey) => (
        <UserAvatarLink pubkey={pubkey} />
      ))}
    </AvatarGroup>
  );
}
