import { DownloadIcon } from "@chakra-ui/icons";
import {
  LinkProps,
  Link,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Image,
  ModalFooter,
  Button,
} from "@chakra-ui/react";
import { PropsWithChildren, createContext, useContext, useState } from "react";

const GalleryContext = createContext({
  isOpen: false,
  openImage(url: string) {},
});
export function useGalleryContext() {
  return useContext(GalleryContext);
}

export function ImageGalleryLink({ children, href, ...props }: Omit<LinkProps, "onClick">) {
  const { openImage } = useGalleryContext();

  return (
    <Link
      {...props}
      href={href}
      onClick={(e) => {
        if (href) {
          e.preventDefault();
          openImage(href);
        }
      }}
    >
      {children}
    </Link>
  );
}

export function ImageGalleryProvider({ children }: PropsWithChildren) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [image, setImage] = useState("");

  const openImage = (url: string) => {
    setImage(url);
    onOpen();
  };
  const context = { isOpen, openImage };

  return (
    <GalleryContext.Provider value={context}>
      {children}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody p="0">
            <Image src={image} w="full" />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="brand" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </GalleryContext.Provider>
  );
}
