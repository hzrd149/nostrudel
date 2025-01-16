import { MouseEventHandler, useCallback } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { To } from "react-router";

import { DrawerIcon } from "../icons";
import { useNavigateInDrawer } from "../../providers/drawer-sub-view-provider";

export default function OpenInDrawerButton({
  to,
  onClick,
  ...props
}: Omit<IconButtonProps, "aria-label"> & { to: To }) {
  const navigate = useNavigateInDrawer();

  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      navigate(to);
      if (onClick) onClick(e);
    },
    [navigate, onClick],
  );

  return (
    <IconButton
      icon={<DrawerIcon />}
      aria-label="Open in drawer"
      title="Open in drawer"
      onClick={handleClick}
      {...props}
    />
  );
}
