import { useContext } from "react";
import { Button, Flex, FlexProps } from "@chakra-ui/react";

import { PublishContext } from "../../providers/global/publish-provider";
import { useTaskManagerContext } from "../../views/task-manager/provider";
import PublishActionStatusTag from "../../views/task-manager/publish-log/action-status-tag";
import PasscodeLock from "../icons/passcode-lock";
import relayPoolService from "../../services/relay-pool";

export default function TaskManagerButtons({ ...props }: Omit<FlexProps, "children">) {
  const { log } = useContext(PublishContext);
  const { openTaskManager } = useTaskManagerContext();

  const pendingAuth = Array.from(relayPoolService.challenges.entries()).filter(
    ([r, c]) => r.connected && !!c.value && !relayPoolService.authenticated.get(r).value,
  );

  return (
    <Flex gap="2" {...props}>
      <Button
        justifyContent="space-between"
        onClick={() => openTaskManager(log.length === 0 ? "/relays" : "/publish-log")}
        py="2"
        variant="link"
        w="full"
      >
        Task Manager
        {log.length > 0 && <PublishActionStatusTag entry={log[log.length - 1]} />}
      </Button>
      {pendingAuth.length > 0 && (
        <Button
          leftIcon={<PasscodeLock boxSize={5} />}
          aria-label="Pending Auth"
          title="Pending Auth"
          ml="auto"
          size="sm"
          variant="ghost"
          color="red"
          onClick={() => openTaskManager({ pathname: "/relays", search: "?tab=auth" })}
        >
          {pendingAuth.length}
        </Button>
      )}
    </Flex>
  );
}
