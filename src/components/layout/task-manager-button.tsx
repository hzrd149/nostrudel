import { useContext } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";

import { PublishContext } from "../../providers/global/publish-provider";
import { useTaskManagerContext } from "../../views/task-manager/provider";
import PublishActionStatusTag from "../../views/task-manager/publish-log/action-status-tag";

export default function TaskManagerButton({ ...props }: Omit<ButtonProps, "children">) {
  const { log } = useContext(PublishContext);
  const { openTaskManager } = useTaskManagerContext();

  return (
    <Button variant="link" justifyContent="space-between" onClick={() => openTaskManager("/network")} {...props}>
      Task Manager
      {log.length > 0 && <PublishActionStatusTag action={log[log.length - 1]} />}
    </Button>
  );
}
