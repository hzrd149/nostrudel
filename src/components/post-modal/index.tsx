import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from "@chakra-ui/react";
import { PostForm, PostFormProps } from "./post-form";

type PostModalProps = PostFormProps & {
  isOpen: boolean;
  onClose: () => void;
};

export const PostModal = ({ isOpen, onClose, onSubmit, onCancel }: PostModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>New Post</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <PostForm onSubmit={onSubmit} onCancel={onCancel} />
      </ModalBody>
    </ModalContent>
  </Modal>
);
