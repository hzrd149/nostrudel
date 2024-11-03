import { Spinner, Tag, TagLabel, TagProps } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import PublishAction from "../../../classes/nostr-publish-action";
import { CheckIcon, ErrorIcon } from "../../../components/icons";

export default function PublishActionStatusTag({
  action,
  ...props
}: { action: PublishAction } & Omit<TagProps, "children">) {
  const results = useObservable(action.results);

  const successful = results.filter(({ success }) => success);
  const failedWithMessage = results.filter(({ success, message }) => !success && !!message);

  let statusIcon = <Spinner size="xs" />;
  let statusColor: TagProps["colorScheme"] = "blue";
  if (results.length !== action.relays.length) {
    statusColor = "blue";
    statusIcon = <Spinner size="xs" />;
  } else if (successful.length === 0) {
    statusColor = "red";
    statusIcon = <ErrorIcon />;
  } else if (failedWithMessage.length > 0) {
    statusColor = "orange";
    statusIcon = <CheckIcon />;
  } else {
    statusColor = "green";
    statusIcon = <CheckIcon />;
  }

  return (
    <Tag colorScheme={statusColor} {...props}>
      <TagLabel mr="1">
        {successful.length}/{action.relays.length}
      </TagLabel>
      {statusIcon}
    </Tag>
  );
}
