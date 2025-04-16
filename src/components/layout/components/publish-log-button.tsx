import { Button, ButtonProps } from "@chakra-ui/react";
import { useContext } from "react";

import { PublishContext, PublishLogEntry } from "../../../providers/global/publish-provider";
import { useTaskManagerContext } from "../../../views/task-manager/provider";
import { usePublishLogEntryStatus } from "../../../views/task-manager/publish-log/action-status-tag";

function PublishLogEntryButton({ entry, ...props }: Omit<ButtonProps, "children"> & { entry: PublishLogEntry }) {
  const { openTaskManager } = useTaskManagerContext();

  const { color, successful, total } = usePublishLogEntryStatus(entry);

  return (
    <Button onClick={() => openTaskManager("/publish-log")} colorScheme={color} {...props}>
      {successful.length}/{total}
    </Button>
  );
}

export default function PublishLogButton({ ...props }: Omit<ButtonProps, "children" | "onClick">) {
  const { log } = useContext(PublishContext);
  const { openTaskManager } = useTaskManagerContext();

  const entry = log[log.length - 1];
  if (!entry) return null;

  return <PublishLogEntryButton entry={entry} onClick={() => openTaskManager("/publish-log")} {...props} />;
}
