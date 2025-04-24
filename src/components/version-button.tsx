import { useState } from "react";
import { Button, ButtonProps, useToast } from "@chakra-ui/react";

import { CheckIcon, CopyToClipboardIcon } from "./icons";

export default function VersionButton({ ...props }: Omit<ButtonProps, "children">) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const version = [import.meta.env.VITE_APP_VERSION, import.meta.env.VITE_COMMIT_HASH].filter(Boolean).join("-");

  if (!version) return null;

  return (
    <Button
      variant="link"
      size="sm"
      rightIcon={copied ? <CheckIcon /> : <CopyToClipboardIcon />}
      onClick={() => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(version);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else toast({ description: version, isClosable: true, duration: null });
      }}
      aria-label={copied ? "Version copied" : "Copy version"}
      aria-live="polite"
      {...props}
    >
      {version}
    </Button>
  );
}
