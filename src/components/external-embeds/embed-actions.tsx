import { Button, ButtonGroup, ButtonGroupProps, Link } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "../icons";

export default function EmbedActions({
  open,
  url,
  label,
  onToggle,
  ...props
}: Omit<ButtonGroupProps, "children"> & {
  open: boolean;
  onToggle: (open: boolean) => void;
  url?: string | URL;
  label: string;
}) {
  return (
    <ButtonGroup variant="link" size="sm" {...props}>
      <Button onClick={() => onToggle(!open)}>
        [ {label} {open ? <ChevronDownIcon /> : <ChevronUpIcon />} ]
      </Button>
      {navigator.clipboard && url && (
        <Button onClick={() => navigator.clipboard.writeText(url.toString())}>[ Copy ]</Button>
      )}
      {open && url && (
        <Button as={Link} href={url.toString()} isExternal>
          [ Open ]
        </Button>
      )}
    </ButtonGroup>
  );
}
