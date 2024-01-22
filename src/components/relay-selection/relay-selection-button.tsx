import { ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";

import { RelayIcon } from "../icons";
import RelayManagementDrawer from "../relay-management-drawer";

export default function RelaySelectionButton({ ...props }: ButtonProps) {
  const relaysModal = useDisclosure();
  return (
    <>
      <IconButton
        icon={<RelayIcon />}
        onClick={relaysModal.onOpen}
        aria-label="Relays"
        title="Relays"
        variant="ghost"
        {...props}
      />
      <RelayManagementDrawer isOpen={relaysModal.isOpen} onClose={relaysModal.onClose} />
    </>
  );
}
