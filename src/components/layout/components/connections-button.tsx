import { Button, ButtonProps } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";

import { connections$ } from "../../../services/pool";
import { useTaskManagerContext } from "../../../views/task-manager/provider";

export default function RelayConnectionButton({ ...props }: Omit<ButtonProps, "children" | "onClick">) {
  const { openTaskManager } = useTaskManagerContext();

  const connections = useObservableState(connections$) ?? {};
  const connected = Object.values(connections).reduce((t, s) => (s === "connected" ? t + 1 : t), 0);

  return (
    <Button onClick={() => openTaskManager("/relays")} {...props}>
      Relays ({connected})
    </Button>
  );
}
