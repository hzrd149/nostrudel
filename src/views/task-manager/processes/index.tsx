import { Flex, useInterval } from "@chakra-ui/react";

import ProcessBranch from "./process/process-tree";
import processManager from "../../../services/process-manager";
import useForceUpdate from "../../../hooks/use-force-update";

export default function TaskManagerProcesses() {
  const update = useForceUpdate();
  useInterval(update, 500);

  const rootProcesses = processManager.getRootProcesses();

  return (
    <Flex direction="column">
      {rootProcesses.map((process) => (
        <ProcessBranch key={process.id} process={process} />
      ))}
    </Flex>
  );
}
