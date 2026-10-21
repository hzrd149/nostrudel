import { Badge, Button, Flex, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { getNappletIdentity, getNappletRequiredCapabilities } from "../../../helpers/nostr/napplets";
import { addAlwaysAllowed, alwaysAllowed$, revokeAlwaysAllowed } from "../../../services/napplet-shell/permissions";

/** Whether an installed napplet opens without asking, and the permissions it asks for */
export default function NappletDetailPermissions({ event }: { event: NostrEvent }) {
  const identity = useMemo(() => getNappletIdentity(event), [event]);
  const capabilities = useMemo(() => getNappletRequiredCapabilities(event), [event]);
  const grants = use$(alwaysAllowed$);
  const own = useMemo(
    () => (grants ?? []).filter((grant) => grant.pubkey === identity.pubkey && grant.dTag === identity.dTag),
    [grants, identity],
  );
  const allowed = own.some((grant) => grant.aggregateHash === identity.aggregateHash);
  const olderVersions = own.filter((grant) => grant.aggregateHash !== identity.aggregateHash).length;

  if (capabilities.length === 0) return <Text color="GrayText">This app does not ask for any permissions.</Text>;

  return (
    <Flex direction="column" gap="4">
      <Flex gap="3" alignItems="center" wrap="wrap">
        <Text flex="1">
          {allowed
            ? "This version opens without asking for permission."
            : "This app asks for permission each time it opens."}
          {!allowed && olderVersions > 0 && (
            <Text as="span" color="GrayText">
              {" "}
              Older versions were always allowed; updates ask again.
            </Text>
          )}
        </Text>
        {(allowed || olderVersions > 0) && (
          <Button size="sm" variant="outline" onClick={() => revokeAlwaysAllowed(identity.pubkey, identity.dTag)}>
            Ask every time
          </Button>
        )}
        {!allowed && (
          <Button size="sm" colorScheme="primary" onClick={() => addAlwaysAllowed(identity, capabilities)}>
            Always allow
          </Button>
        )}
      </Flex>
      <Flex direction="column" gap="2">
        <Text fontWeight="semibold">Requested permissions</Text>
        <Flex gap="1" wrap="wrap">
          {capabilities.map((capability) => (
            <Badge key={capability} textTransform="none" colorScheme={allowed ? "primary" : undefined}>
              {capability}
            </Badge>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}
