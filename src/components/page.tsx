import React from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "./error-boundary";
import { ConnectedRelays } from "./connected-relays";

import homeIcon from "./icons/home.svg";
import globalIcon from "./icons/global.svg";
import settingsIcon from "./icons/settings.svg";
import profileIcon from "./icons/profile.svg";
import { useIsMobile } from "../hooks/use-is-mobile";
import useSubject from "../hooks/use-subject";
import identity from "../services/identity";

const MobileLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const pubkey = useSubject(identity.pubkey);

  return (
    <Flex direction="column" height="100%">
      <Box flexGrow={1} overflow="auto">
        {children}
      </Box>
      <Flex flexShrink={0} gap="2" padding="2">
        <IconButton
          icon={<img src={homeIcon} />}
          aria-label="Home"
          onClick={() => navigate("/")}
          flexGrow="1"
          size="lg"
        />
        <IconButton
          icon={<img src={globalIcon} />}
          aria-label="Global Feed"
          onClick={() => navigate("/global")}
          flexGrow="1"
          size="lg"
        />
        <IconButton
          icon={<img src={profileIcon} />}
          aria-label="Profile"
          onClick={() => navigate(`/user/${pubkey}`)}
          flexGrow="1"
          size="lg"
        />
        <IconButton
          icon={<img src={settingsIcon} />}
          aria-label="Settings"
          onClick={() => navigate("/settings")}
          flexGrow="1"
          size="lg"
        />
      </Flex>
    </Flex>
  );
};
const DesktopLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const pubkey = useSubject(identity.pubkey);

  return (
    <Container
      size="lg"
      display="flex"
      gap="4"
      height="100vh"
      overflow="hidden"
    >
      <VStack width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
        <Button onClick={() => navigate("/")}>Home</Button>
        <Button onClick={() => navigate(`/user/${pubkey}`)}>Profile</Button>
        <Button onClick={() => navigate("/global")}>Global Feed</Button>
        <Button onClick={() => navigate("/settings")}>Settings</Button>
        <ConnectedRelays />
      </VStack>
      <Box flexGrow={1} overflow="hidden">
        <ErrorBoundary>{children}</ErrorBoundary>
      </Box>
      <VStack width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
        <Button onClick={() => navigate("/")}>Manage Follows</Button>
      </VStack>
    </Container>
  );
};

export const Page = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return <Layout>{children}</Layout>;
};
