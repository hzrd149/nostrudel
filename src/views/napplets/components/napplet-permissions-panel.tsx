import { Button, Flex, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import UserName from "../../../components/user/user-name";
import NappletPermissionControls from "../../../components/napplets/permission-controls";
import { permissionEntries$, identityKey, revokeAlwaysAllowed } from "../../../services/napplet-shell/permissions";
import useAsyncAction from "../../../hooks/use-async-action";
import { NAPPLET_PERMISSIONS } from "../../../services/napplet-shell/permission-types";

/** Saved grants are version-specific, including explicit blocks and Ask defaults. */
export default function NappletPermissionsPanel({ exclude }: { exclude?: Set<string> }) {
  const entries = use$(permissionEntries$)?.filter((entry) => !exclude?.has(`${entry.pubkey}:${entry.dTag}`)) ?? [];
  const { run, loading } = useAsyncAction(
    async (pubkey: string, dTag: string) => revokeAlwaysAllowed(pubkey, dTag),
    [],
  );
  if (!entries.length) return <Text>No saved app permissions.</Text>;
  return (
    <Flex direction="column" gap="6">
      {entries.map((entry) => (
        <Flex key={identityKey(entry)} direction="column" gap="3">
          <Flex gap="3" align="center">
            <Flex direction="column" flex="1">
              <Text fontWeight="bold">{entry.title || entry.dTag || "App"}</Text>
              <UserName pubkey={entry.pubkey} />
            </Flex>
            <Button variant="ghost" isLoading={loading} onClick={() => run(entry.pubkey, entry.dTag)}>
              Reset permissions
            </Button>
          </Flex>
          <NappletPermissionControls identity={entry} permissions={[...NAPPLET_PERMISSIONS]} />
        </Flex>
      ))}
    </Flex>
  );
}
