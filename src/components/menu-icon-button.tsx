import { Menu, MenuButton, MenuList, IconButton, MenuListProps, IconButtonProps } from "@chakra-ui/react";
import { MoreIcon } from "./icons";

export type MenuIconButtonProps = IconButtonProps & {
  children: MenuListProps["children"];
};

export function MenuIconButton({ children, ...props }: MenuIconButtonProps) {
  return (
    <Menu isLazy>
      <MenuButton as={IconButton} icon={<MoreIcon />} {...props} />
      <MenuList>{children}</MenuList>
    </Menu>
  );
}
