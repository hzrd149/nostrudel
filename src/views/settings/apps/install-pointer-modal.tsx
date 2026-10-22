import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";
import { FormEventHandler, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

/** Opens a napplet's store page from a raw manifest pointer */
export default function InstallPointerModal({ isOpen, onClose }: Omit<ModalProps, "children">) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const submit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onClose();
      navigate(`/app/store/${trimmed}`);
    },
    [navigate, value, onClose],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={submit}>
        <ModalHeader>Install from naddr</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Manifest pointer</FormLabel>
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="naddr1..., nevent1..., or note1..."
            />
          </FormControl>
        </ModalBody>
        <ModalFooter gap="2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" colorScheme="primary" isDisabled={!value.trim()}>
            View
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
