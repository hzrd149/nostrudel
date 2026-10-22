import { CloseIcon } from "@chakra-ui/icons";
import { Badge, Box, Flex, IconButton, LinkBox, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import NappletIconImage from "../../../components/napplets/napplet-icon";
import Timestamp from "../../../components/timestamp";
import UserName from "../../../components/user/user-name";
import { getNappletEventPointer, parseNappletPointer } from "../../../helpers/nostr/napplets";
import useEvent from "../../../hooks/use-event";
import { InstalledNapplet } from "../../../services/installed-napplets";
import NappletDetailPermissions from "./napplet-detail-permissions";

export default function InstalledNappletCard({
  napplet,
  onUninstall,
}: {
  napplet: InstalledNapplet;
  onUninstall: () => void;
}) {
  const pointer = useMemo(() => {
    const decoded = parseNappletPointer(napplet.address);
    return decoded && getNappletEventPointer(decoded);
  }, [napplet.address]);
  const manifest = useEvent(pointer);
  const updated = !!manifest && napplet.openedVersion !== undefined && manifest.created_at > napplet.openedVersion;

  return (
    <Flex as={LinkBox} gap="3" alignItems="flex-start">
      <NappletIconImage event={manifest} boxSize="12" />
      <Flex direction="column" gap="2" flex="1" minW="0">
        <Box>
          <Flex gap="2" alignItems="center" minW="0">
            <HoverLinkOverlay as={RouterLink} to={`/app/store/${napplet.address}`} fontWeight="semibold" noOfLines={1}>
              {napplet.title}
            </HoverLinkOverlay>
            {updated && <Badge colorScheme="primary">Updated</Badge>}
          </Flex>
          <Flex gap="1" color="GrayText" alignItems="center" minW="0">
            <UserName pubkey={napplet.pubkey} isTruncated />
            <Text>·</Text>
            <Timestamp timestamp={Math.round(napplet.lastOpenedAt / 1000)} whiteSpace="nowrap" />
          </Flex>
          {napplet.description && (
            <Text color="GrayText" noOfLines={2}>
              {napplet.description}
            </Text>
          )}
        </Box>
        {manifest && (
          <Box position="relative" zIndex={2}>
            <NappletDetailPermissions event={manifest} />
          </Box>
        )}
      </Flex>
      <IconButton
        variant="ghost"
        aria-label="Uninstall napplet"
        icon={<CloseIcon />}
        zIndex={2}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUninstall();
        }}
      />
    </Flex>
  );
}
