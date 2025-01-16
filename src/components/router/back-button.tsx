import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { useNavigate } from "react-router";

import { ChevronLeftIcon } from "../icons";

export default function BackButton({
  fallback,
  ...props
}: { fallback?: string } & Omit<IconButtonProps, "onClick" | "children" | "aria-label">) {
  const navigate = useNavigate();
  return (
    <IconButton
      icon={<ChevronLeftIcon boxSize={6} />}
      variant="ghost"
      aria-label="Back"
      {...props}
      onClick={() => (history.state.idx === 0 ? navigate(fallback ?? "/") : navigate(-1))}
    >
      Back
    </IconButton>
  );
}

export function BackIconButton({
  fallback,
  ...props
}: { fallback?: string } & Omit<IconButtonProps, "onClick" | "children" | "aria-label">) {
  const navigate = useNavigate();
  return (
    <IconButton
      icon={<ChevronLeftIcon boxSize={6} />}
      aria-label="Back"
      variant="ghost"
      {...props}
      onClick={() => (history.state.idx === 0 ? navigate(fallback ?? "/") : navigate(-1))}
    />
  );
}
