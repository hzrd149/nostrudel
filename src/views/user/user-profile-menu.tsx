import { Avatar, MenuItem } from "@chakra-ui/react";
import { MenuIconButton } from "../../components/menu-icon-button";

import { ClipboardIcon, IMAGE_ICONS } from "../../components/icons";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";
import { useCopyToClipboard } from "react-use";
import { truncatedId } from "../../helpers/nostr-event";

export const UserProfileMenu = ({ pubkey }: { pubkey: string }) => {
  const [_clipboardState, copyToClipboard] = useCopyToClipboard();
  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey);

  return (
    <MenuIconButton>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.nostrGuruIcon} size="xs" />}
        href={`https://www.nostr.guru/p/${npub}`}
        target="_blank"
      >
        Open in Nostr.guru
      </MenuItem>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.astralIcon} size="xs" />}
        href={`https://astral.ninja/${npub}`}
        target="_blank"
      >
        Open in astral
      </MenuItem>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.brbIcon} size="xs" />}
        href={`https://brb.io/u/${npub}`}
        target="_blank"
      >
        Open in BRB
      </MenuItem>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.snortSocialIcon} size="xs" />}
        href={`https://snort.social/p/${npub}`}
        target="_blank"
      >
        Open in snort.social
      </MenuItem>
      {npub && (
        <MenuItem onClick={() => copyToClipboard(npub)} icon={<ClipboardIcon />}>
          Copy {truncatedId(npub)}
        </MenuItem>
      )}
    </MenuIconButton>
  );
};
