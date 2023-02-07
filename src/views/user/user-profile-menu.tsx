import { Avatar, MenuItem } from "@chakra-ui/react";
import { MenuIconButton } from "../../components/menu-icon-button";

import { IMAGE_ICONS } from "../../components/icons";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";
import { useCopyToClipboard } from "react-use";
import { truncatedId } from "../../helpers/nostr-event";

export const UserProfileMenu = ({ pubkey }: { pubkey: string }) => {
  return (
    <MenuIconButton>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.nostrGuruIcon} size="xs" />}
        href={`https://www.nostr.guru/p/${pubkey}`}
        target="_blank"
      >
        Open in Nostr.guru
      </MenuItem>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.astralIcon} size="xs" />}
        href={`https://astral.ninja/${normalizeToBech32(
          pubkey,
          Bech32Prefix.Pubkey
        )}`}
        target="_blank"
      >
        Open in astral
      </MenuItem>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.brbIcon} size="xs" />}
        href={`https://brb.io/u/${pubkey}`}
        target="_blank"
      >
        Open in BRB
      </MenuItem>
    </MenuIconButton>
  );
};
