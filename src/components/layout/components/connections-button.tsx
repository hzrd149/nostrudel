import { Button, ButtonProps } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { useTaskManagerContext } from "../../../views/task-manager/provider";
import { connections$ } from "../../../services/pool";

export default function RelayConnectionButton({ ...props }: Omit<ButtonProps, "children" | "onClick">) {
  const { openTaskManager } = useTaskManagerContext();

  const connections = useObservable(connections$) || {};
  const connected = Object.values(connections).reduce((t, s) => (s === "connected" ? t + 1 : t), 0);

  return (
    <Button onClick={() => openTaskManager("/relays")} {...props}>
      Relays ({connected})
    </Button>
  );
}
