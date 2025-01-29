import { Suspense } from "react";
import {
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  ModalProps,
  Spinner,
} from "@chakra-ui/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

type Router = ReturnType<typeof createMemoryRouter>;

export default function TaskManagerModal({
  router,
  isOpen,
  onClose,
}: { router: Router } & Omit<ModalProps, "children">) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", lg: "6xl" }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalBody display="flex" flexDirection="column" gap="2" p="0">
          <Suspense
            fallback={
              <Heading size="md" mx="auto" my="4">
                <Spinner /> Loading page
              </Heading>
            }
          >
            <RouterProvider router={router} />
          </Suspense>
        </ModalBody>
        <ModalCloseButton />
      </ModalContent>
    </Modal>
  );
}
