import { Alert, AlertIcon, Button, Flex, Link } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import { getSharableEventAddress } from "../../../services/relay-hints";

export type MutedNotePlaceholderProps = {
  event: NostrEvent;
  onShowAnyway?: () => void;
  showHeader?: boolean;
  compact?: boolean;
};

export default function MutedNotePlaceholder({
  event,
  onShowAnyway,
  showHeader = true,
  compact = false,
}: MutedNotePlaceholderProps) {
  const handleShowAnyway = () => {
    onShowAnyway?.();
  };

  if (compact) {
    return (
      <Alert status="warning" size="sm">
        <AlertIcon />
        <Flex gap="2" alignItems="center" flex="1">
          {showHeader && (
            <>
              <UserAvatarLink pubkey={event.pubkey} size="xs" />
              <UserLink pubkey={event.pubkey} fontWeight="bold" fontSize="sm" />
              <UserDnsIdentity pubkey={event.pubkey} onlyIcon />
              <Link
                as={RouterLink}
                to={`/n/${getSharableEventAddress(event)}`}
                whiteSpace="nowrap"
                color="current"
                fontSize="sm"
              >
                <Timestamp timestamp={event.created_at} />
              </Link>
            </>
          )}
          <Flex flex="1" alignItems="center" gap="2">
            <AlertIcon />
            <span>Muted user or note</span>
          </Flex>
          <Button size="xs" onClick={handleShowAnyway}>
            Show anyway
          </Button>
        </Flex>
      </Alert>
    );
  }

  return (
    <Alert status="warning">
      <AlertIcon />
      Muted user or note
      <Button size="xs" ml="auto" onClick={handleShowAnyway}>
        Show anyway
      </Button>
    </Alert>
  );
}
