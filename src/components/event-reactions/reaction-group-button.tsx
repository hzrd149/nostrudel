import { Button, ButtonProps, IconButton } from "@chakra-ui/react";
import ReactionIcon from "./reaction-icon";

export default function ReactionGroupButton({
  emoji,
  url,
  count,
  ...props
}: Omit<ButtonProps, "leftIcon" | "children"> & { emoji: string; count: number; url?: string }) {
  if (count <= 1) {
    return <IconButton icon={<ReactionIcon emoji={emoji} url={url} />} aria-label="Reaction" {...props} />;
  }

  return (
    <Button leftIcon={<ReactionIcon emoji={emoji} url={url} />} title={emoji} {...props}>
      {count > 1 && count}
    </Button>
  );
}
