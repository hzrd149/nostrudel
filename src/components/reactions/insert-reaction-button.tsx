import { useCallback } from "react";
import { IconButtonProps } from "@chakra-ui/react";
import { Emoji } from "applesauce-core/helpers";

import SelectReactionButton from "./select-reaction-button";

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
      else onSelect(`:${emoji.shortcode}:`, emoji);
    },
    [onSelect],
  );

  return (
    <>
      <SelectReactionButton onSelect={handleSelect} {...props} />
    </>
  );
}
