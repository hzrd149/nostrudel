import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";

export default function ExpandButton({
  isOpen,
  onToggle,
  ...props
}: { isOpen: boolean; onToggle: () => void } & Omit<IconButtonProps, "aria-label" | "title">) {
  return (
    <IconButton
      onClick={onToggle}
      icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      aria-label={isOpen ? "Collapse" : "Expand"}
      title={isOpen ? "Collapse" : "Expand"}
      {...props}
    />
  );
}
