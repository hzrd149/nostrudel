import { Button, ButtonProps } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import { RelayIcon } from "../../icons";
import { connections$ } from "../../../services/pool";
import { useTaskManagerContext } from "../../../views/task-manager/provider";

export default function RelayConnectionButton({ ...props }: Omit<ButtonProps, "children" | "onClick">) {
  const { openTaskManager } = useTaskManagerContext();

  const connections = use$(connections$) ?? {};
  const connected = Object.values(connections).reduce((t, s) => (s === "connected" ? t + 1 : t), 0);
  const label = `${connected} relay${connected === 1 ? "" : "s"} connected`;

  return (
    <Button
      aria-label={label}
      title={label}
      leftIcon={<RelayIcon boxSize={5} />}
      onClick={() => openTaskManager("/relays")}
      flexShrink={0}
      {...props}
    >
      {connected}
    </Button>
  );
}
