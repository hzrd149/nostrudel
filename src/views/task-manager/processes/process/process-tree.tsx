import { Flex, Text, useDisclosure } from "@chakra-ui/react";

import ProcessIcon from "./process-icon";
import Process from "../../../../classes/process";
import ExpandButton from "../../../tools/event-console/expand-button";

export default function ProcessBranch({
  process,
  level = 0,
  filter,
}: {
  process: Process;
  level?: number;
  filter?: (process: Process) => boolean;
}) {
  const showChildren = useDisclosure({ defaultIsOpen: !!process.parent });

  return (
    <>
      <Flex gap="2" p="2" alignItems="center" ml={level + "em"}>
        <ProcessIcon process={process} boxSize={6} />
        <Text as="span" isTruncated fontWeight="bold">
          {process.type}
        </Text>
        <Text as="span" color="GrayText">
          {process.id}
        </Text>
        {process.children.size > 0 && (
          <ExpandButton isOpen={showChildren.isOpen} onToggle={showChildren.onToggle} variant="ghost" size="xs" />
        )}
        <Text fontSize="sm" color="GrayText">
          {process.name}
          {process.relays.size > 1
            ? ` ${process.relays.size} relays`
            : Array.from(process.relays)
                .map((r) => r.url)
                .join(", ")}
        </Text>
      </Flex>
      {showChildren.isOpen &&
        Array.from(process.children)
          .filter((p) => (filter ? filter(p) : true))
          .map((child) => <ProcessBranch key={child.id} process={child} level={level + 1} filter={filter} />)}
    </>
  );
}
