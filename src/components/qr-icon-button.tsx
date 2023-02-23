import {
  IconButton,
  IconButtonProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  useDisclosure,
} from "@chakra-ui/react";
import { QrCodeIcon } from "./icons";
import QrCodeSvg from "./qr-code-svg";

export const QrIconButton = ({ content, ...props }: { content: string } & Omit<IconButtonProps, "icon">) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <IconButton icon={<QrCodeIcon />} onClick={onOpen} {...props} />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <QrCodeSvg content={content} border={2} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
