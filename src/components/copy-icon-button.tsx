import { useState } from "react";
import { Button, ButtonProps, IconButton, IconButtonProps, useToast } from "@chakra-ui/react";

import { CheckIcon, CopyToClipboardIcon } from "./icons";

type CopyIconButtonProps = Omit<IconButtonProps, "icon" | "value"> & {
  value: string | undefined | (() => string);
  icon?: IconButtonProps["icon"];
};

export function CopyIconButton({ value, icon, ...props }: CopyIconButtonProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <IconButton
      icon={copied ? <CheckIcon boxSize="1.5em" /> : icon || <CopyToClipboardIcon boxSize="1.2em" />}
      onClick={() => {
        const v: string | undefined = typeof value === "function" ? value() : value;

        if (v && navigator.clipboard && !copied) {
          navigator.clipboard.writeText(v);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else toast({ description: v, isClosable: true, duration: null });
      }}
      {...props}
    />
  );
}

type CopyButtonProps = Omit<ButtonProps, "icon" | "value"> & {
  value: string | undefined | (() => string);
  icon?: IconButtonProps["icon"];
};
export function CopyButton({ value, icon, children, ...props }: CopyButtonProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <Button
      leftIcon={copied ? <CheckIcon boxSize="1.5em" /> : icon || <CopyToClipboardIcon boxSize="1.2em" />}
      onClick={() => {
        const v: string | undefined = typeof value === "function" ? value() : value;

        if (v && navigator.clipboard && !copied) {
          navigator.clipboard.writeText(v);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else toast({ description: v, isClosable: true, duration: null });
      }}
      {...props}
    >
      {copied ? "Copied" : children}
    </Button>
  );
}
