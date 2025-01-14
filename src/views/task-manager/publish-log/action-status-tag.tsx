import { Spinner, Tag, TagLabel, TagProps } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { CheckIcon, ErrorIcon } from "../../../components/icons";
import { PublishLogEntry } from "../../../providers/global/publish-provider";

export default function PublishActionStatusTag({
  entry,
  ...props
}: { entry: PublishLogEntry } & Omit<TagProps, "children">) {
  const { relays } = useObservable(entry);

  const successful = Object.values(relays).filter((p) => p.ok);
  const failedWithNotice = Object.values(relays).filter((p) => !p.ok && !!p.notice);

  let statusIcon = <Spinner size="xs" />;
  let statusColor: TagProps["colorScheme"] = "blue";
  if (Object.keys(relays).length !== entry.relays.length) {
    statusColor = "blue";
    statusIcon = <Spinner size="xs" />;
  } else if (successful.length === 0) {
    statusColor = "red";
    statusIcon = <ErrorIcon />;
  } else if (failedWithNotice.length > 0) {
    statusColor = "orange";
    statusIcon = <CheckIcon />;
  } else {
    statusColor = "green";
    statusIcon = <CheckIcon />;
  }

  return (
    <Tag colorScheme={statusColor} {...props}>
      <TagLabel mr="1">
        {successful.length}/{entry.relays.length}
      </TagLabel>
      {statusIcon}
    </Tag>
  );
}
