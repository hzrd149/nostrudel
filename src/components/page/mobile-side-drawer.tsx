import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  Flex,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import accountService from "../../services/account";
import { LogoutIcon, ProfileIcon, RelayIcon, SettingsIcon } from "../icons";
import { UserAvatar } from "../user-avatar";
import AccountSwitcher from "./account-switcher";

export default function MobileSideDrawer({ ...props }: Omit<DrawerProps, "children">) {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const metadata = useUserMetadata(account.pubkey);

  return (
    <Drawer placement="left" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <Flex gap="2">
            <UserAvatar pubkey={account.pubkey} size="sm" />
            <Text>{getUserDisplayName(metadata, account.pubkey)}</Text>
          </Flex>
        </DrawerHeader>
        <DrawerBody padding={0} overflowY="auto" overflowX="hidden">
          <AccountSwitcher />
          <Flex direction="column" gap="2" padding="2">
            <Button onClick={() => navigate(`/u/${account.pubkey}`)} leftIcon={<ProfileIcon />}>
              Profile
            </Button>
            <Button onClick={() => navigate("/relays")} leftIcon={<RelayIcon />}>
              Relays
            </Button>
            <Button onClick={() => navigate("/settings")} leftIcon={<SettingsIcon />}>
              Settings
            </Button>
            <Button onClick={() => accountService.logout()} leftIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Flex>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
