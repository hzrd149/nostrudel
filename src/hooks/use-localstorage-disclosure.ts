import { useDisclosure } from "@chakra-ui/react";
import { useLocalStorage } from "react-use";

export default function useLocalStorageDisclosure(name: string, defaultIsOpen?: boolean) {
  const [value, setValue] = useLocalStorage<boolean>(name, defaultIsOpen);

  return useDisclosure({
    isOpen: value,
    onOpen: () => setValue(true),
    onClose: () => setValue(false),
    defaultIsOpen: value,
  });
}
