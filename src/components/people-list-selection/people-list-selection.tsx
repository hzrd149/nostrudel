import { Select, SelectProps, useDisclosure } from "@chakra-ui/react";
import { usePeopleListContext } from "./people-list-provider";

export default function PeopleListSelection({
  hideGlobalOption = false,
  ...props
}: {
  hideGlobalOption?: boolean;
} & Omit<SelectProps, "value" | "onChange" | "children">) {
  const { people, list, setList } = usePeopleListContext();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Select
      value={list}
      onChange={(e) => {
        setList(e.target.value);
      }}
      {...props}
    >
      <option value="following">Following</option>
      {!hideGlobalOption && <option value="global">Global</option>}
    </Select>
  );
}
