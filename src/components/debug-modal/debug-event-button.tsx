import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useContext } from "react";

import { DebugModalContext } from "../../providers/route/debug-modal-provider";
import { CodeIcon } from "../icons";

export default function DebugEventButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const { open } = useContext(DebugModalContext);

  return <IconButton icon={<CodeIcon />} aria-label="Raw Event" onClick={() => open(event)} {...props} />;
}
