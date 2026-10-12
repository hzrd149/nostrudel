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
import useAsyncAction from "../../../../hooks/use-async-action";

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
  const wipeDatabase = useAsyncAction(async () => {
    await wipe();
    location.reload();
  }, [wipe]);

  return (
    <ButtonGroup isAttached {...props}>
      <Button colorScheme="primary" onClick={enable} isDisabled={enabled} isLoading={isLoading}>
        {enabled ? "Enabled" : "Enable"}
      </Button>
      <Menu>
        <MenuButton as={IconButton} icon={<ChevronDownIcon />} aria-label="More options" isLoading={isLoading} />
        <MenuList>
          <MenuItem icon={<Trash01 />} color="red.500" onClick={wipeDatabase.run}>
            Clear Database
          </MenuItem>
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
}
