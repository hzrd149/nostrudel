import { ComponentWithAs, Flex, FlexProps, IconButton, IconProps, Spinner, useDisclosure } from "@chakra-ui/react";
import { createContext, ReactNode, Suspense, useContext } from "react";
import { Outlet, RouteObject, useLocation } from "react-router-dom";

import {
  Button,
  Grid,
  GridItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { ProfilePointer } from "nostr-tools/nip19";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";
import { ErrorBoundary } from "../../error-boundary";
import DotsGrid from "../../icons/dots-grid";
import RouterLink from "../../router-link";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";
import SimpleHeader from "../components/simple-header";

const TabsContext = createContext<AppTabs[]>([]);

export function AppTabsProvider({ children, tabs }: { children: ReactNode; tabs: AppTabs[] }) {
  return <TabsContext.Provider value={tabs}>{children}</TabsContext.Provider>;
}

export type AppTabs = RouteObject & {
  label: string;
  path: string;
  icon: ComponentWithAs<"svg", IconProps>;
};

export function AppTabsBar({ tabs, ...props }: { tabs?: AppTabs[] } & Omit<FlexProps, "children">) {
  tabs = tabs || useContext(TabsContext);
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get the current tab from the last segment of the path
  const pathSegments = location.pathname.split("/");
  const basePath = pathSegments.slice(0, 3).join("/") + "/";
  const currentPath = pathSegments[3] || "";

  return (
    <>
      <Flex gap="2" borderBottom="1px solid var(--chakra-colors-chakra-border-color)" {...props}>
        {/* First tab - square button that opens modal */}
        <IconButton
          icon={<DotsGrid boxSize={5} />}
          onClick={onOpen}
          variant="ghost"
          size="sm"
          flexShrink={0}
          aria-label="Select view"
          my="2"
          ml="2"
        />

        <Flex
          py="2"
          pr="2"
          overflowX="auto"
          overflowY="hidden"
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          gap="2"
          alignItems="center"
        >
          {/* Current tab button */}
          {tabs.map((tab) => (
            <Button
              key={tab.path}
              as={RouterLink}
              to={basePath + tab.path}
              size="sm"
              variant={tab.path === currentPath ? "solid" : "ghost"}
              colorScheme={tab.path === currentPath ? "primary" : undefined}
              flexShrink={0}
              onClick={onClose}
            >
              <tab.icon boxSize={4} mr="1" />
              {tab.label}
            </Button>
          ))}
        </Flex>
      </Flex>

      {/* Modal with all available tabs */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader px={4} pt={4} pb={2}>
            Select View
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={2} pb={2} pt={0}>
            <Grid templateColumns="repeat(3, 1fr)" gap={3}>
              {tabs.map((tab) => (
                <GridItem key={tab.path}>
                  <Button
                    as={RouterLink}
                    to={basePath + tab.path}
                    w="full"
                    h="20"
                    variant={tab.path === currentPath ? "solid" : "outline"}
                    colorScheme={tab.path === currentPath ? "primary" : "gray"}
                    fontSize="sm"
                    textAlign="center"
                    whiteSpace="normal"
                    wordBreak="break-word"
                    flexDirection="row"
                    flexWrap="wrap"
                    gap={2}
                    onClick={onClose}
                  >
                    <tab.icon boxSize={6} />
                    {tab.label}
                  </Button>
                </GridItem>
              ))}
            </Grid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function AppTabsLayout({
  children,
  as,
  tabs,
  header,
  ...props
}: Omit<FlexProps, "title"> & {
  header?: ReactNode;
  tabs?: AppTabs[];
}) {
  tabs = tabs || useContext(TabsContext);

  return (
    <Flex
      data-type="user-layout"
      as={as}
      flex={1}
      direction="column"
      pr="var(--safe-right)"
      pl="var(--safe-left)"
      overflow="hidden"
      {...props}
    >
      {header}

      {/* Horizontal scrollable tab bar */}
      <AppTabsBar tabs={tabs} />

      <Suspense fallback={<Spinner />}>
        <ErrorBoundary>{children || <Outlet />}</ErrorBoundary>
      </Suspense>
    </Flex>
  );
}
