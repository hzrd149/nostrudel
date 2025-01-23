import { useCallback } from "react";
import { IconButtonProps } from "@chakra-ui/react";
import { Emoji } from "applesauce-core/helpers";

import ReactionIconButton from "./reaction-icon-button";

export default function InsertReactionButton({
  onSelect,
  ...props
}: Omit<IconButtonProps, "icon" | "onSelect"> & {
  onSelect?: (emojiCode: string, emoji?: string | Emoji) => void;
}) {
  const handleSelect = useCallback(
    (emoji: Emoji | string) => {
      if (!onSelect) return;
      if (typeof emoji === "string") onSelect(emoji, emoji);
      else onSelect(`:${emoji.name}:`, emoji);
    },
    [onSelect],
  );

  return (
    <>
      <ReactionIconButton onSelect={handleSelect} {...props} />
    </>
  );
}
