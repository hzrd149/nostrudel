import { CloseIcon } from "@chakra-ui/icons";
import { Box, Card, CardBody, Flex, IconButton, LinkBox, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import Timestamp from "../../../components/timestamp";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import { InstalledNapplet } from "../../../services/installed-napplets";

export default function InstalledNappletCard({
  napplet,
  onUninstall,
}: {
  napplet: InstalledNapplet;
  onUninstall: () => void;
}) {
  return (
    <Card as={LinkBox} variant="outline" size="sm">
      <CardBody p="2">
        <Flex alignItems="center" gap="3">
          <UserAvatar pubkey={napplet.pubkey} size="sm" />
          <Box flex="1" minW="0">
            <HoverLinkOverlay as={RouterLink} to={`/app/store/${napplet.address}`} fontWeight="semibold" noOfLines={1}>
              {napplet.title}
            </HoverLinkOverlay>
            <Flex gap="1" fontSize="xs" color="GrayText" alignItems="center" minW="0">
              <UserName pubkey={napplet.pubkey} fontSize="xs" isTruncated />
              <Text>·</Text>
              <Timestamp timestamp={Math.round(napplet.lastOpenedAt / 1000)} whiteSpace="nowrap" />
            </Flex>
            {napplet.description && (
              <Text color="GrayText" fontSize="sm" noOfLines={2}>
                {napplet.description}
              </Text>
            )}
          </Box>
          <Flex gap="1" zIndex={2}>
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Uninstall napplet"
              icon={<CloseIcon />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUninstall();
              }}
            />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}
