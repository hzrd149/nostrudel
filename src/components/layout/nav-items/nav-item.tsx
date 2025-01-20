import { useContext } from "react";
import { Button, ComponentWithAs, IconButton, IconButtonProps, IconProps } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { CollapsedContext } from "../context";

export default function NavItem({
  to,
  icon: Icon,
  label,
  colorScheme,
  variant,
}: {
  to: string;
  icon: ComponentWithAs<"svg", IconProps>;
  label: string;
  colorScheme?: IconButtonProps["colorScheme"];
  variant?: IconButtonProps["variant"];
}) {
  const collapsed = useContext(CollapsedContext);
  const location = useLocation();

  if (collapsed)
    return (
      <IconButton
        as={RouterLink}
        aria-label={label}
        title={label}
        icon={<Icon boxSize={5} />}
        fontSize="24"
        variant={variant || "ghost"}
        to={to}
        flexShrink={0}
        colorScheme={colorScheme || (location.pathname.startsWith(to) ? "primary" : undefined)}
      />
    );
  else
    return (
      <Button
        as={RouterLink}
        aria-label={label}
        title={label}
        leftIcon={<Icon boxSize={5} />}
        variant={variant || "link"}
        p="2"
        justifyContent="flex-start"
        colorScheme={colorScheme || (location.pathname.startsWith(to) ? "primary" : undefined)}
        to={to}
        flexShrink={0}
      >
        {label}
      </Button>
    );
}
