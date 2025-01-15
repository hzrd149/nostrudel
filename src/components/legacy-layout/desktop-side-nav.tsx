import { useContext } from "react";
import { Avatar, Box, Button, Flex, FlexProps, Heading, IconButton, LinkOverlay } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { css } from "@emotion/react";
import { useObservable } from "applesauce-react/hooks";

import Plus from "../icons/plus";
import useCurrentAccount from "../../hooks/use-current-account";
import AccountSwitcher from "../layout/nav-items/account-switcher";
import NavItems from "../layout/nav-items";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import { offlineMode } from "../../services/offline-mode";
import WifiOff from "../icons/wifi-off";
import TaskManagerButtons from "./task-manager-buttons";
import localSettings from "../../services/local-settings";

const hideScrollbar = css`
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export default function DesktopSideNav(props: Omit<FlexProps, "children">) {
  const account = useCurrentAccount();
  const { openModal } = useContext(PostModalContext);
  const offline = useObservable(offlineMode);
  const showBrandLogo = useObservable(localSettings.showBrandLogo);

  return (
    <Flex
      {...props}
      gap="2"
      direction="column"
      width="15rem"
      p="2"
      alignItems="stretch"
      flexShrink={0}
      h="100vh"
      overflowY="auto"
      overflowX="hidden"
      css={hideScrollbar}
    >
      <Flex direction="column" flexShrink={0} gap="2">
        {showBrandLogo && (
          <Flex gap="2" alignItems="center" position="relative" my="2">
            <Avatar src="/apple-touch-icon.png" size="md" />
            <Heading size="md">
              <LinkOverlay as={RouterLink} to="/">
                noStrudel
              </LinkOverlay>
            </Heading>
            {offline && (
              <IconButton
                aria-label="Disable offline mode"
                title="Disable offline mode"
                icon={<WifiOff boxSize={5} color="orange" />}
                onClick={() => offlineMode.next(false)}
              />
            )}
          </Flex>
        )}
        {account && (
          <>
            <AccountSwitcher />
            <Button
              as={RouterLink}
              leftIcon={<Plus boxSize={6} />}
              aria-label="Create new"
              title="Create new"
              colorScheme="primary"
              size="lg"
              to="/new"
            >
              New
            </Button>
          </>
        )}
        <NavItems />
        <Box h="4" />
        {!account && (
          <Button
            as={RouterLink}
            to="/signin"
            state={{ from: location.pathname }}
            colorScheme="primary"
            w="full"
            flexShrink={0}
          >
            Sign in
          </Button>
        )}
      </Flex>
      <TaskManagerButtons mt="auto" flexShrink={0} />
    </Flex>
  );
}
