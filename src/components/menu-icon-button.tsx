import { Menu, MenuButton, MenuList, IconButton, MenuListProps, MenuButtonProps } from "@chakra-ui/react";
import { MoreIcon } from "./icons";

export type MenuIconButtonProps = MenuButtonProps & {
  children: MenuListProps["children"];
};

export const MenuIconButton = ({ children, ...props }: MenuIconButtonProps) => (
  <Menu isLazy>
    <MenuButton as={IconButton} icon={<MoreIcon />} aria-label="view raw" title="view raw" size="xs" {...props} />
    <MenuList>{children}</MenuList>
  </Menu>
);
