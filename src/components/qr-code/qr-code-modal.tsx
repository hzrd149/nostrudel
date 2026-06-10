import {
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";

import QrCodeSvg from "./qr-code-svg";
import { CopyIconButton } from "../copy-icon-button";

export type QrCodeModalProps = Omit<ModalProps, "children"> & {
  /** The value encoded in the QR code (e.g. a uri) */
  content: string;
  /** The value shown in the input and copied (defaults to content) */
  value?: string;
  title?: string;
};

export default function QrCodeModal({ content, value = content, title, ...props }: QrCodeModalProps) {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        {title && <ModalHeader p="4">{title}</ModalHeader>}
        <ModalCloseButton />
        <ModalBody p="4" pt={title ? 0 : 4}>
          <Flex gap="3" direction="column">
            <QrCodeSvg content={content} maxW="3in" mx="auto" w="full" aria-label="QR code" />
            <Flex gap="2">
              <Input value={value} userSelect="all" readOnly onChange={() => {}} />
              <CopyIconButton value={value} aria-label="Copy" variant="solid" size="md" />
            </Flex>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
