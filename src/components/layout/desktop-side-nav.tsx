import { useContext } from "react";
import { Avatar, Box, Button, Flex, FlexProps, Heading, LinkOverlay } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { css } from "@emotion/react";

import { useCurrentAccount } from "../../hooks/use-current-account";
import AccountSwitcher from "./account-switcher";
import PublishLog from "../publish-log";
import NavItems from "./nav-items";
import { PostModalContext } from "../../providers/post-modal-provider";
import { WritingIcon } from "../icons";

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
        <Flex gap="2" alignItems="center" position="relative" my="2">
          <Avatar src="/apple-touch-icon.png" size="md" />
          <Heading size="md">
            <LinkOverlay as={RouterLink} to="/">
              noStrudel
            </LinkOverlay>
          </Heading>
        </Flex>
        {account && (
          <>
            <AccountSwitcher />
            <Button
              leftIcon={<WritingIcon />}
              aria-label="Write Note"
              title="Write Note"
              onClick={() => openModal()}
              colorScheme="primary"
              size="lg"
              isDisabled={account.readonly}
            >
              Write Note
            </Button>
          </>
        )}
        <NavItems />
        <Box h="4" />
        {!account && (
          <Button as={RouterLink} to="/login" state={{ from: location.pathname }} colorScheme="primary" w="full">
            Login
          </Button>
        )}
      </Flex>
      <PublishLog overflowY="auto" minH="15rem" my="4" />
    </Flex>
  );
}
