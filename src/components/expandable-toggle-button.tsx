import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "./icons";

export default function ExpandableToggleButton({
  toggle,
  ...props
}: { toggle: { isOpen: boolean; onToggle: () => void } } & Omit<IconButtonProps, "icon">) {
  return (
    <IconButton
      icon={toggle.isOpen ? <ChevronUpIcon boxSize={6} /> : <ChevronDownIcon boxSize={6} />}
      variant="ghost"
      onClick={toggle.onToggle}
      {...props}
    />
  );
}
