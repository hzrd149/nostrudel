import { lazy, Suspense } from "react";
import {
  Flex,
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
  Spinner,
  Text,
  useBoolean,
} from "@chakra-ui/react";
import { Emoji } from "applesauce-core/helpers/emoji";

import { AddReactionIcon } from "../icons";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";

const ReactionPicker = lazy(() => import("./reaction-picker"));

export default function SelectReactionButton({
  portal = false,
  onSelect,
  ...props
}: { portal?: boolean; onSelect?: (emoji: string | Emoji) => void } & Omit<
  IconButtonProps,
  "children" | "aria-label" | "onSelect"
>) {
  const useModal = useBreakpointValue({ base: true, md: false });
  const [isOpen, open] = useBoolean();

  const handleSelect = (emoji: string | Emoji) => {
    onSelect?.(emoji);
    open.off();
  };

  const picker = (
    <Suspense
      fallback={
        <Flex p="4" gap="2">
          <Spinner />
          <Text>Loading emojis...</Text>
        </Flex>
      }
    >
      <ReactionPicker onSelect={handleSelect} autoFocus />
    </Suspense>
  );

  if (useModal)
    return (
      <>
        <IconButton
          icon={<AddReactionIcon boxSize="1.3em" />}
          aria-label="Add Reaction"
          title="Add Reaction"
          onClick={open.on}
          {...props}
        />

        <Modal isOpen={isOpen} onClose={open.off}>
          <ModalOverlay />
          <ModalContent w="auto">{picker}</ModalContent>
        </Modal>
      </>
    );
  else
    return (
      <Popover isLazy isOpen={isOpen} onOpen={open.on} onClose={open.off}>
        <PopoverTrigger>
          <IconButton
            icon={<AddReactionIcon boxSize="1.3em" />}
            aria-label="Add Reaction"
            title="Add Reaction"
            {...props}
          />
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
