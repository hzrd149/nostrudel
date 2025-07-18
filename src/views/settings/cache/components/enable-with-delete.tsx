import {
  Button,
  ButtonGroup,
  ButtonGroupProps,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { useCallback } from "react";

import { ChevronDownIcon } from "../../../../components/icons";
import Trash01 from "../../../../components/icons/trash-01";

export default function EnableWithDelete({
  enable,
  enabled,
  wipe,
  isLoading,
  ...props
}: Omit<ButtonGroupProps, "children"> & {
  enable: () => void;
  enabled: boolean;
  wipe: () => Promise<void>;
  isLoading?: boolean;
}) {
  const wipeDatabase = useCallback(async () => {
    try {
      await wipe();
      location.reload();
    } catch (error) {}
  }, []);

  return (
    <ButtonGroup isAttached {...props}>
      <Button colorScheme="primary" onClick={enable} isDisabled={enabled} isLoading={isLoading}>
        {enabled ? "Enabled" : "Enable"}
      </Button>
      <Menu>
        <MenuButton as={IconButton} icon={<ChevronDownIcon />} aria-label="More options" isLoading={isLoading} />
        <MenuList>
          <MenuItem icon={<Trash01 />} color="red.500" onClick={wipeDatabase}>
            Clear Database
          </MenuItem>
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
}
