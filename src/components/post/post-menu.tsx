import { Avatar, MenuItem } from "@chakra-ui/react";
import { useCopyToClipboard } from "react-use";

import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";
import { NostrEvent } from "../../types/nostr-event";
import { MenuIconButton } from "../menu-icon-button";
import { truncatedId } from "../../helpers/nostr-event";

import { IMAGE_ICONS } from "../icons";

export const PostMenu = ({ event }: { event: NostrEvent }) => {
  const [_clipboardState, copyToClipboard] = useCopyToClipboard();

  return (
    <MenuIconButton>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.nostrGuruIcon} size="xs" />}
        href={`https://www.nostr.guru/e/${event.id}`}
        target="_blank"
      >
        Open in Nostr.guru
      </MenuItem>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.astralIcon} size="xs" />}
        href={`https://astral.ninja/${normalizeToBech32(
          event.id,
          Bech32Prefix.Note
        )}`}
        target="_blank"
      >
        Open in astral
      </MenuItem>
      <MenuItem
        as="a"
        icon={<Avatar src={IMAGE_ICONS.brbIcon} size="xs" />}
        href={`https://brb.io/n/${event.id}`}
        target="_blank"
      >
        Open in BRB
      </MenuItem>
      <MenuItem
        as="a"
        href={`https://snort.social/e/${event.id}`}
        target="_blank"
      >
        Open in snort.social
      </MenuItem>
      <MenuItem onClick={() => copyToClipboard(event.id)}>
        Copy {truncatedId(event.id)}
      </MenuItem>
    </MenuIconButton>
  );
};
