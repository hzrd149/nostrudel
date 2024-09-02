import { Button, ButtonGroup, ButtonGroupProps, Link } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "../icons";
import { useCallback, useState } from "react";

export default function EmbedActions({
  open,
  url,
  label,
  onToggle,
  children,
  ...props
}: ButtonGroupProps & {
  open: boolean;
  onToggle: (open: boolean) => void;
  url?: string | URL;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    if (!url) return;
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }, [url]);

  return (
    <ButtonGroup variant="link" size="sm" {...props}>
      <Button onClick={() => onToggle(!open)}>
        [ {label} {open ? <ChevronDownIcon /> : <ChevronUpIcon />} ]
      </Button>
      {navigator.clipboard && url && <Button onClick={copy}>{copied ? "[ Copied ]" : "[ Copy ]"}</Button>}
      {open && url && (
        <Button as={Link} href={url.toString()} isExternal>
          [ Open ]
        </Button>
      )}
      {children}
    </ButtonGroup>
  );
}
