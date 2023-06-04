import { useMemo } from "react";
import { Flex, Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay } from "@chakra-ui/react";
import { ModalProps } from "@chakra-ui/react";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip19";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import RawValue from "./raw-value";
import RawJson from "./raw-json";

export default function UserDebugModal({ pubkey, ...props }: { pubkey: string } & Omit<ModalProps, "children">) {
  const npub = useMemo(() => normalizeToBech32(pubkey, Bech32Prefix.Pubkey), [pubkey]);
  const metadata = useUserMetadata(pubkey);

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody overflow="auto" p="4">
          <Flex gap="2" direction="column">
            <RawValue heading="Hex pubkey" value={pubkey} />
            {npub && <RawValue heading="Encoded pubkey (NIP-19)" value={npub} />}
            <RawJson heading="Metadata (kind 0)" json={metadata} />
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
