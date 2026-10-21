import { Badge, Box, Button, Flex, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useMemo } from "react";

import Timestamp from "../../../components/timestamp";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import {
  alwaysAllowed$,
  revokeAlwaysAllowed,
  type AlwaysAllowedGrant,
} from "../../../services/napplet-shell/permissions";

type NappletGrants = { pubkey: string; dTag: string; title: string; latest: AlwaysAllowedGrant; versions: number };

/** Groups always-allowed versions by napplet, newest grant first */
function groupGrants(grants: AlwaysAllowedGrant[]): NappletGrants[] {
  const groups = new Map<string, NappletGrants>();

  for (const grant of grants) {
    const key = `${grant.pubkey}:${grant.dTag}`;
    const group = groups.get(key);
    if (!group) {
      groups.set(key, {
        pubkey: grant.pubkey,
        dTag: grant.dTag,
        title: grant.title || grant.dTag || "Napplet",
        latest: grant,
        versions: 1,
      });
    } else {
      group.versions++;
      if (grant.grantedAt > group.latest.grantedAt) {
        group.latest = grant;
        group.title = grant.title || group.title;
      }
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.latest.grantedAt - a.latest.grantedAt);
}

export default function NappletPermissionsPanel() {
  const grants = use$(alwaysAllowed$);
  const groups = useMemo(() => groupGrants(grants ?? []), [grants]);

  if (groups.length === 0)
    return <Text color="GrayText">Apps you always allow will appear here. Other apps ask each time they open.</Text>;

  return (
    <Flex direction="column" gap="4">
      <Text color="GrayText" fontSize="sm">
        These apps open without asking for permission. Revoking makes them ask again next time they open.
      </Text>
      {groups.map((group) => (
        <Flex key={`${group.pubkey}:${group.dTag}`} gap="3" alignItems="center">
          <UserAvatar pubkey={group.pubkey} size="sm" />
          <Box flex="1" minW="0">
            <Text fontWeight="semibold" noOfLines={1}>
              {group.title}
            </Text>
            <Flex gap="1" fontSize="xs" color="GrayText" alignItems="center" minW="0" wrap="wrap">
              <UserName pubkey={group.pubkey} fontSize="xs" isTruncated />
              {group.latest.grantedAt > 0 && (
                <>
                  <Text>·</Text>
                  <Timestamp timestamp={group.latest.grantedAt} whiteSpace="nowrap" />
                </>
              )}
              {group.versions > 1 && <Text>· {group.versions} versions</Text>}
            </Flex>
            {group.latest.capabilities.length > 0 && (
              <Flex gap="1" wrap="wrap" mt="1">
                {group.latest.capabilities.map((capability) => (
                  <Badge key={capability} textTransform="none">
                    {capability}
                  </Badge>
                ))}
              </Flex>
            )}
          </Box>
          <Button size="sm" variant="ghost" onClick={() => revokeAlwaysAllowed(group.pubkey, group.dTag)}>
            Revoke
          </Button>
        </Flex>
      ))}
    </Flex>
  );
}
