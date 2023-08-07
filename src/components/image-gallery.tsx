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
import { PropsWithChildren, createContext, forwardRef, useContext, useState } from "react";

const GalleryContext = createContext({
  isOpen: false,
  openImage(url: string) {},
});
export function useGalleryContext() {
  return useContext(GalleryContext);
}

export const ImageGalleryLink = forwardRef(({ children, href, ...props }: Omit<LinkProps, "onClick">, ref) => {
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
      ref={ref}
    >
      {children}
    </Link>
  );
});

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
