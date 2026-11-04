import { Button, Flex, Switch, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import useAsyncAction from "../../hooks/use-async-action";
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

export function hasVisiblePermissions(identity: NappletIdentity, permissions: readonly NappletPermission[]) {
  return permissions.some(
    (permission) =>
      getPermissionDecision(identity, permission) !== "ask" || hasApprovedCapability(identity, permission),
  );
}

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
  const visible = permissions.filter((permission) => hasVisiblePermissions(identity, [permission]));
  if (!visible.length) return null;

  return (
    <Flex direction="column" gap="3" w="full">
      {visible.map((permission) => {
        const decision = getPermissionDecision(identity, permission);
        const blocked = decision === "block";
        return (
          <Flex key={permission} align="center" gap="3" justify="space-between" wrap="wrap">
            <Text flex="1">{permissionLabel(permission)}</Text>
            {(blocked || decision === "ask") && (
              <Text color={blocked ? "red.500" : "green.500"}>{blocked ? "Blocked" : "Allowed for session"}</Text>
            )}
            <Switch
              colorScheme="primary"
              aria-label={permissionLabel(permission)}
              isChecked={!blocked}
              isDisabled={loading}
              onChange={(event) => run(permission, event.target.checked ? "allow" : "block")}
            />
            <Button
              variant="ghost"
              isLoading={loading}
              aria-label={`Reset ${permissionLabel(permission)} to Ask`}
              onClick={() => run(permission, "ask")}
            >
              Reset
            </Button>
          </Flex>
        );
      })}
    </Flex>
  );
}
