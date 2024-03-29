import { useDisclosure } from "@chakra-ui/react";
import React, { PropsWithChildren, useContext } from "react";

type ContextType = { expanded: boolean; onExpand: () => void; onCollapse: () => void; onToggle: () => void };

const ExpandedContext = React.createContext<ContextType | undefined>(undefined);

export function useExpand() {
  return useContext(ExpandedContext);
}

export function ExpandProvider({ children }: PropsWithChildren) {
  const { isOpen: expanded, onOpen: onExpand, onClose: onCollapse, onToggle } = useDisclosure();

  return (
    <ExpandedContext.Provider value={{ expanded, onExpand, onCollapse, onToggle }}>{children}</ExpandedContext.Provider>
  );
}
