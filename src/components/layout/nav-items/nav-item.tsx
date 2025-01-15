import { useContext } from "react";
import { Button, ComponentWithAs, IconButton, IconButtonProps, IconProps } from "@chakra-ui/react";
import { To, Link as RouterLink, useLocation } from "react-router-dom";

import { ExpandedContext } from "../desktop/side-nav";

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
  const expanded = useContext(ExpandedContext);
  const location = useLocation();

  if (expanded)
    return (
      <Button
        as={RouterLink}
        aria-label={label}
        title={label}
        leftIcon={<Icon boxSize={5} />}
        variant={variant || "link"}
        py="2"
        justifyContent="flex-start"
        colorScheme={colorScheme || location.pathname.startsWith(to) ? "primary" : undefined}
        to={to}
      >
        {label}
      </Button>
    );
  else
    return (
      <IconButton
        as={RouterLink}
        aria-label={label}
        title={label}
        icon={<Icon boxSize={5} />}
        fontSize="24"
        variant={variant || "ghost"}
        to={to}
        colorScheme={colorScheme || location.pathname.startsWith(to) ? "primary" : undefined}
      />
    );
}
