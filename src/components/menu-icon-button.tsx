import { Menu, MenuButton, MenuList, IconButton, MenuListProps } from "@chakra-ui/react";
import { MoreIcon } from "./icons";

export type MenuIconButtonProps = {
  children: MenuListProps["children"];
};

export const MenuIconButton = ({ children }: MenuIconButtonProps) => (
  <Menu isLazy>
    <MenuButton as={IconButton} icon={<MoreIcon />} aria-label="view raw" title="view raw" size="xs" />
    <MenuList>{children}</MenuList>
  </Menu>
);
