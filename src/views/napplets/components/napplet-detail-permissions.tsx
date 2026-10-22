import { Badge, Button, Flex } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { getNappletIdentity, getNappletRequiredCapabilities } from "../../../helpers/nostr/napplets";
import { addAlwaysAllowed, alwaysAllowed$, revokeAlwaysAllowed } from "../../../services/napplet-shell/permissions";

/** The permissions an installed napplet asks for, highlighted when it opens without asking */
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

  if (capabilities.length === 0) return null;

  return (
    <Flex gap="2" alignItems="center" wrap="wrap">
      {capabilities.map((capability) => (
        <Badge key={capability} textTransform="none" colorScheme={allowed ? "primary" : undefined}>
          {capability}
        </Badge>
      ))}
      <Flex gap="2" ms="auto">
        {(allowed || olderVersions > 0) && (
          <Button variant="outline" onClick={() => revokeAlwaysAllowed(identity.pubkey, identity.dTag)}>
            Ask every time
          </Button>
        )}
        {!allowed && (
          <Button colorScheme="primary" onClick={() => addAlwaysAllowed(identity, capabilities)}>
            Always allow
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
