import { Badge, Box, Button, Flex, LinkBox, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { nip19 } from "nostr-tools";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import NappletIconImage from "../../../components/napplets/napplet-icon";
import Timestamp from "../../../components/timestamp";
import UserName from "../../../components/user/user-name";
import { NAPPLET_KIND_NAMED, NAPPLET_KIND_ROOT, getNappletTitle } from "../../../helpers/nostr/napplets";
import useEvent from "../../../hooks/use-event";
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

function NappletPermissionRow({ group }: { group: NappletGrants }) {
  // Root napplets are replaceable with no `d` tag; named napplets are addressable
  const pointer = useMemo(
    () => ({
      kind: group.dTag ? NAPPLET_KIND_NAMED : NAPPLET_KIND_ROOT,
      pubkey: group.pubkey,
      identifier: group.dTag,
    }),
    [group.pubkey, group.dTag],
  );
  const manifest = useEvent(pointer);
  const naddr = useMemo(() => nip19.naddrEncode(pointer), [pointer]);

  return (
    <Flex as={LinkBox} gap="3" alignItems="center">
      <NappletIconImage event={manifest} boxSize="10" />
      <Box flex="1" minW="0">
        <HoverLinkOverlay as={RouterLink} to={`/app/store/${naddr}`} fontWeight="semibold" noOfLines={1}>
          {manifest ? getNappletTitle(manifest) : group.title}
        </HoverLinkOverlay>
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
      <Button
        size="sm"
        variant="ghost"
        zIndex={2}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          revokeAlwaysAllowed(group.pubkey, group.dTag);
        }}
      >
        Revoke
      </Button>
    </Flex>
  );
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
        <NappletPermissionRow key={`${group.pubkey}:${group.dTag}`} group={group} />
      ))}
    </Flex>
  );
}
