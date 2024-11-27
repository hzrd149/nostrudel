import { IconButton, IconButtonProps, useDisclosure } from "@chakra-ui/react";
import Clapperboard from "../icons/clapperboard";
import GifPickerModal from "./gif-picker-modal";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";
import { getTagValue } from "applesauce-core/helpers";

export default function InsertGifButton({
  onSelect,
  onSelectURL,
  ...props
}: Omit<IconButtonProps, "icon" | "onSelect"> & {
  onSelect?: (gif: NostrEvent) => void;
  onSelectURL?: (url: string) => void;
}) {
  const modal = useDisclosure();

  const handleSelect = useCallback(
    (gif: NostrEvent) => {
      if (onSelect) onSelect(gif);
      if (onSelectURL) {
        const url = getTagValue(gif, "url");
        if (url) onSelectURL(url);
      }
    },
    [onSelect, onSelectURL],
  );

  return (
    <>
      <IconButton icon={<Clapperboard boxSize={5} />} onClick={modal.onOpen} {...props} />
      {modal.isOpen && <GifPickerModal onClose={modal.onClose} isOpen onSelect={handleSelect} />}
    </>
  );
}
