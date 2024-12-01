import { MenuGroupProps } from './menu-group.mjs';
import { UseMenuOptionGroupProps } from './use-menu.mjs';
import '@chakra-ui/system';
import '@chakra-ui/descendant';
import '@chakra-ui/popper';
import '@chakra-ui/react-use-disclosure';
import '@chakra-ui/lazy-utils';
import 'react';

interface MenuOptionGroupProps extends UseMenuOptionGroupProps, Omit<MenuGroupProps, "value" | "defaultValue" | "onChange"> {
}
declare const MenuOptionGroup: React.FC<MenuOptionGroupProps>;

export { MenuOptionGroup, MenuOptionGroupProps };
