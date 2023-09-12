import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { To } from "react-router-dom";

import { DrawerIcon } from "./icons";
import { useNavigateInDrawer } from "../providers/drawer-sub-view-provider";

export default function OpenInDrawerButton({ to, ...props }: Omit<IconButtonProps, "aria-label"> & { to: To }) {
  const navigate = useNavigateInDrawer();

  return (
    <IconButton
      icon={<DrawerIcon />}
      aria-label="Open in drawer"
      title="Open in drawer"
      onClick={() => navigate(to)}
      {...props}
    />
  );
}
