import { useState } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";

import { CheckIcon, ClipboardIcon } from "./icons";

export const CopyIconButton = ({ text, ...props }: { text?: string } & Omit<IconButtonProps, "icon">) => {
  const [copied, setCopied] = useState(false);

  return (
    <IconButton
      icon={copied ? <CheckIcon /> : <ClipboardIcon />}
      onClick={() => {
        if (text && navigator.clipboard && !copied) {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
      {...props}
    />
  );
};
