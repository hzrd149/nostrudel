import { Button, ButtonProps } from "@chakra-ui/react";
import { CheckIcon, ClipboardIcon } from "./icons";
import { useState } from "react";

export default function VersionButton({ ...props }: Omit<ButtonProps, "children">) {
  const [copied, setCopied] = useState(false);
  const version = [import.meta.env.VITE_APP_VERSION, import.meta.env.VITE_COMMIT_HASH].filter(Boolean).join("-");

  if (!version) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      rightIcon={copied ? <CheckIcon /> : <ClipboardIcon />}
      onClick={() => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(version);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
      {...props}
    >
      Version: {version}
    </Button>
  );
}
