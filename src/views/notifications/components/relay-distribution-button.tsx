import { Button, ButtonProps, useDisclosure } from "@chakra-ui/react";
import { Filter } from "nostr-tools";

import RelayDistributionModal from "./relay-distribution-modal";

export type RelayDistributionButtonProps = Omit<ButtonProps, "icon" | "aria-label" | "filter"> & {
  filter: Filter;
  title?: string;
};

export default function RelayDistributionButton({ filter, title, ...props }: RelayDistributionButtonProps) {
  const modal = useDisclosure();

  return (
    <>
      <Button aria-label="Show relay distribution" onClick={modal.onOpen} variant="ghost" {...props}>
        Info
      </Button>
      {modal.isOpen && (
        <RelayDistributionModal isOpen={modal.isOpen} onClose={modal.onClose} filter={filter} title={title} />
      )}
    </>
  );
}
