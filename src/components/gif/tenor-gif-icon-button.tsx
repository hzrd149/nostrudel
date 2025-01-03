import {
  IconButton,
  IconButtonProps,
  Modal,
  ModalContent,
  ModalOverlay,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  Portal,
  useBoolean,
  useColorMode,
} from "@chakra-ui/react";
import GifPicker, { TenorImage, Theme } from "gif-picker-react";

import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import Clapperboard from "../icons/clapperboard";
import { TENOR_API_KEY } from "../../const";

export default function TenorGifIconButton({
  portal = false,
  onSelect,
  ...props
}: { portal?: boolean; onSelect?: (gif: string) => void } & Omit<
  IconButtonProps,
  "children" | "aria-label" | "onSelect"
>) {
  const useModal = useBreakpointValue({ base: true, md: false });
  const { colorMode } = useColorMode();
  const [isOpen, open] = useBoolean();

  const handleSelect = (gif: TenorImage) => {
    onSelect?.(gif.url);
    open.off();
  };

  const picker = (
    <GifPicker
      tenorApiKey={TENOR_API_KEY!}
      onGifClick={handleSelect}
      theme={colorMode === "light" ? Theme.LIGHT : Theme.DARK}
    />
  );

  if (useModal) {
    return (
      <>
        <IconButton
          icon={<Clapperboard boxSize={5} />}
          aria-label="Add Gif"
          title="Add Gif"
          onClick={open.on}
          {...props}
        />

        <Modal isOpen={isOpen} onClose={open.off}>
          <ModalOverlay />
          <ModalContent w="auto">{picker}</ModalContent>
        </Modal>
      </>
    );
  } else
    return (
      <Popover isLazy isOpen={isOpen} onOpen={open.on} onClose={open.off}>
        <PopoverTrigger>
          <IconButton icon={<Clapperboard boxSize={5} />} aria-label="Add Gif" title="Add Gif" {...props} />
        </PopoverTrigger>
        {portal ? (
          <Portal>
            <PopoverContent w="350px" border="none" rounded="xl">
              <PopoverArrow />
              {picker}
            </PopoverContent>
          </Portal>
        ) : (
          <PopoverContent w="350px" border="none" rounded="xl">
            <PopoverArrow />
            {picker}
          </PopoverContent>
        )}
      </Popover>
    );
}
