import { Flex, Select, Text } from "@chakra-ui/react";
import useAsyncAction from "../../hooks/use-async-action";
import { use$ } from "applesauce-react/hooks";
import {
  permissionEntries$,
  hasApprovedCapability,
  getPermissionDecision,
  setPermissionDecision,
  type NappletIdentity,
} from "../../services/napplet-shell/permissions";
import {
  permissionLabel,
  type NappletPermission,
  type PermissionDecision,
} from "../../services/napplet-shell/permission-types";

export default function NappletPermissionControls({
  identity,
  permissions,
}: {
  identity: NappletIdentity;
  permissions: NappletPermission[];
}) {
  use$(permissionEntries$);
  const { run, loading } = useAsyncAction(
    async (permission: NappletPermission, decision: PermissionDecision) => {
      setPermissionDecision(identity, permission, decision);
    },
    [identity],
  );
  return (
    <Flex direction="column" gap="3" w="full">
      {permissions.map((permission) => (
        <Flex key={permission} align="center" gap="3" justify="space-between">
          <Text>{permissionLabel(permission)}</Text>
          <Select
            w="auto"
            minW="28"
            aria-label={`${permissionLabel(permission)} for ${identity.title ?? identity.dTag ?? "app"}`}
            value={
              getPermissionDecision(identity, permission) === "ask" && hasApprovedCapability(identity, permission)
                ? "session"
                : getPermissionDecision(identity, permission)
            }
            isDisabled={loading}
            onChange={(event) => run(permission, event.target.value as PermissionDecision)}
          >
            <option value="session" disabled>
              Allowed for session
            </option>
            <option value="ask">Ask</option>
            <option value="allow">Allow</option>
            <option value="block">Block</option>
          </Select>
        </Flex>
      ))}
    </Flex>
  );
}
