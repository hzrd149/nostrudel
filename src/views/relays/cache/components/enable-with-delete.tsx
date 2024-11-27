import { useCallback, useState } from "react";
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

import { ChevronDownIcon } from "../../../../components/icons";
import Trash01 from "../../../../components/icons/trash-01";

export default function EnableWithDelete({
  enable,
  enabled,
  wipe,
  ...props
}: Omit<ButtonGroupProps, "children"> & {
  enable: () => void;
  enabled: boolean;
  wipe: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const wipeDatabase = useCallback(async () => {
    try {
      setDeleting(true);
      await wipe();
      location.reload();
    } catch (error) {}
    setDeleting(false);
  }, []);

  return (
    <ButtonGroup isAttached {...props}>
      <Button colorScheme="primary" onClick={enable} isDisabled={enabled}>
        {enabled ? "Enabled" : "Enable"}
      </Button>
      <Menu>
        <MenuButton as={IconButton} icon={<ChevronDownIcon />} aria-label="More options" />
        <MenuList>
          <MenuItem icon={<Trash01 />} color="red.500" onClick={wipeDatabase}>
            Clear Database
          </MenuItem>
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
}
