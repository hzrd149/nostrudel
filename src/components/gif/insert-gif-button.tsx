import { useCallback } from "react";
import { IconButton, IconButtonProps, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { getTagValue } from "applesauce-core/helpers";

import TenorGifIconButton from "./tenor-gif-icon-button";
import Clapperboard from "../icons/clapperboard";
import GifPickerModal from "./gif-picker-modal";
import { TENOR_API_KEY } from "../../const";

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

  if (TENOR_API_KEY) {
    return <TenorGifIconButton onSelect={onSelectURL} {...props} />;
  } else
    return (
      <>
        <IconButton icon={<Clapperboard boxSize={5} />} onClick={modal.onOpen} {...props} />
        {modal.isOpen && <GifPickerModal onClose={modal.onClose} isOpen onSelect={handleSelect} />}
      </>
    );
}
