import { MenuItem } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { NostrEvent } from "../../types/nostr-event";
import { CustomMenuIconButton, MenuIconButtonProps } from "../menu-icon-button";
import Translate01 from "../icons/translate-01";
import { getSharableEventAddress } from "../../helpers/nip19";
import Tool01 from "../icons/tool-01";
import Recording02 from "../icons/recording-02";

export default function NoteToolsMenu({
  event,
  ...props
}: { event: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <CustomMenuIconButton icon={<Tool01 />} {...props}>
        <MenuItem as={RouterLink} icon={<Recording02 />} to={`/tools/transform/${getSharableEventAddress(event)}`}>
          Text to speech
        </MenuItem>
        <MenuItem as={RouterLink} icon={<Translate01 />} to={`/tools/transform/${getSharableEventAddress(event)}`}>
          Translate
        </MenuItem>
      </CustomMenuIconButton>
    </>
  );
}
