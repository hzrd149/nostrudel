import { useState } from "react";
import { IconButton, IconButtonProps, useToast } from "@chakra-ui/react";

import { CheckIcon, CopyToClipboardIcon } from "./icons";

export const CopyIconButton = ({ value, ...props }: { value?: string } & Omit<IconButtonProps, "icon">) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <IconButton
      icon={copied ? <CheckIcon /> : <CopyToClipboardIcon />}
      onClick={() => {
        if (value && navigator.clipboard && !copied) {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else toast({ description: value, isClosable: true, duration: null });
      }}
      {...props}
    />
  );
};
