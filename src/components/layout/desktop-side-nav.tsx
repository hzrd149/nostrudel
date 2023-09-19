import { useContext } from "react";
import { Avatar, Button, Flex, FlexProps, Heading, IconButton, LinkOverlay, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { useCurrentAccount } from "../../hooks/use-current-account";
import accountService from "../../services/account";
import { EditIcon, LogoutIcon } from "../icons";
import ProfileButton from "./profile-button";
import AccountSwitcher from "./account-switcher";
import { PostModalContext } from "../../providers/post-modal-provider";
import PublishLog from "../publish-log";
import NavItems from "./nav-items";

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
    >
      <Flex direction="column" flexShrink={0} gap="2">
        <Flex gap="2" alignItems="center" position="relative">
          <LinkOverlay as={RouterLink} to="/" />
          <Avatar src="/apple-touch-icon.png" size="sm" />
          <Heading size="md">noStrudel</Heading>
        </Flex>
        <Flex gap="2" overflow="hidden">
          {account ? (
            <>
              <ProfileButton />
              <IconButton
                icon={<EditIcon />}
                aria-label="New note"
                title="New note"
                w="3rem"
                h="3rem"
                fontSize="1.5rem"
                colorScheme="brand"
                onClick={() => openModal()}
                flexShrink={0}
              />
            </>
          ) : (
            <Button as={RouterLink} to="/login" state={{ from: location.pathname }} colorScheme="brand" w="full">
              Login
            </Button>
          )}
        </Flex>
        <AccountSwitcher />
        <NavItems />
        {account && (
          <Button
            onClick={() => accountService.logout()}
            leftIcon={<LogoutIcon />}
            variant="link"
            justifyContent="flex-start"
            pl="2"
            py="2"
          >
            Logout
          </Button>
        )}
        {account?.readonly && (
          <Text color="red.200" textAlign="center">
            Readonly Mode
          </Text>
        )}
      </Flex>
      <PublishLog overflowY="auto" minH="15rem" my="4" />
    </Flex>
  );
}
