import {
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  ModalProps,
  Spinner,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

import { PersistentSubject } from "../../classes/subject";
import useSubject from "../../hooks/use-subject";
import DatabaseView from "../relays/cache/database";
import TaskManagerNetwork from "./network";
import { Suspense } from "react";

type Router = ReturnType<typeof createMemoryRouter>;

export default function TaskManagerModal({
  router,
  isOpen,
  onClose,
}: { router: Router } & Omit<ModalProps, "children">) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
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
          {/* <Tabs
            display="flex"
            flexDirection="column"
            flexGrow="1"
            isLazy
            colorScheme="primary"
            position="relative"
            variant="unstyled"
          >
            <TabList overflowX="auto" overflowY="hidden" flexShrink={0} mr="10">
              <Tab>Network</Tab>
              <Tab>Database</Tab>
            </TabList>
            <TabIndicator height="2px" bg="primary.500" borderRadius="1px" />

            <TabPanels minH="50vh">
              <TabPanel p={0}>
                <TaskManagerNetwork />
              </TabPanel>
              <TabPanel>
                <DatabaseView />
              </TabPanel>
            </TabPanels>
          </Tabs> */}
        </ModalBody>
        <ModalCloseButton />
      </ModalContent>
    </Modal>
  );
}
