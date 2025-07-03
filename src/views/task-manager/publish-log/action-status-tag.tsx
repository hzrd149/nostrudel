import { Spinner, Tag, TagLabel, TagProps } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";
import { PublishResponse } from "applesauce-relay";

import { CheckIcon, ErrorIcon } from "../../../components/icons";
import { PublishLogEntry } from "../../../providers/global/publish-provider";

export function usePublishLogEntryStatus(entry: PublishLogEntry) {
  const relays = useObservableState(entry.relayStatus$) ?? {};

  const total = entry.relays.length;
  const successful = Object.values(relays).filter((p) => p?.ok) as PublishResponse[];
  const failedWithMessage = Object.values(relays).filter((p) => !p?.ok && !!p?.message) as PublishResponse[];

  let icon = <Spinner size="xs" />;
  let color: TagProps["colorScheme"] = "blue";
  if (Object.keys(relays).length !== entry.relays.length) {
    color = "blue";
    icon = <Spinner size="xs" />;
  } else if (successful.length === 0) {
    color = "red";
    icon = <ErrorIcon />;
  } else if (failedWithMessage.length > 0) {
    color = "orange";
    icon = <CheckIcon />;
  } else {
    color = "green";
    icon = <CheckIcon />;
  }

  return { color, icon, successful, failedWithNotice: failedWithMessage, total };
}

export default function PublishActionStatusTag({
  entry,
  ...props
}: { entry: PublishLogEntry } & Omit<TagProps, "children">) {
  const { icon, color, successful, total } = usePublishLogEntryStatus(entry);

  return (
    <Tag colorScheme={color} {...props}>
      <TagLabel mr="1">
        {successful.length}/{total}
      </TagLabel>
      {icon}
    </Tag>
  );
}
