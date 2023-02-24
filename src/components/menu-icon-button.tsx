import { Menu, MenuButton, MenuList, IconButton, MenuListProps, IconButtonProps } from "@chakra-ui/react";
import { MoreIcon } from "./icons";

export type MenuIconButtonProps = IconButtonProps & {
  children: MenuListProps["children"];
};

export const MenuIconButton = ({ children, ...props }: MenuIconButtonProps) => (
  <Menu isLazy>
    <MenuButton as={IconButton} icon={<MoreIcon />} {...props} />
    <MenuList>{children}</MenuList>
  </Menu>
);
