import { Box, CloseButton, Flex, FlexProps } from "@chakra-ui/react";

import useCurrentAccount from "../../../hooks/use-current-account";
import GhostTimeline from "./timeline";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";
import UserDnsIdentity from "../../user/user-dns-identity";
import accountService from "../../../services/account";

export default function GhostSideBar({ ...props }: Omit<FlexProps, "children">) {
  const account = useCurrentAccount()!;

  return (
    <Flex direction="column" borderWidth={1} overflow="hidden" maxH="100vh" position="sticky" top="0" {...props}>
      <Flex gap="2" borderBottomWidth={1} p="4" alignItems="center">
        <UserAvatar pubkey={account.pubkey} size="md" />
        <Flex direction="column">
          <UserLink pubkey={account.pubkey} fontWeight="bold" />
          <UserDnsIdentity pubkey={account.pubkey} />
        </Flex>
        <CloseButton ml="auto" mb="auto" onClick={() => accountService.stopGhost()} />
      </Flex>
      <GhostTimeline p="4" flex={1} />
    </Flex>
  );
}
