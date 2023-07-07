import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { useReadRelayUrls } from "../hooks/use-client-relays";
import { useDisclosure } from "@chakra-ui/react";
import RelaySelectionModal from "../components/relay-selection/relay-selection-modal";
import { unique } from "../helpers/array";
import { useLocation, useNavigate } from "react-router-dom";

type RelaySelectionContextType = {
  relays: string[];
  setSelected: (relays: string[]) => void;
  openModal: () => void;
};

export const RelaySelectionContext = createContext<RelaySelectionContextType>({
  relays: [],
  setSelected: () => {},
  openModal: () => {},
});

export function useRelaySelectionContext() {
  return useContext(RelaySelectionContext);
}
export function useRelaySelectionRelays() {
  return useContext(RelaySelectionContext).relays;
}

export type RelaySelectionProviderProps = PropsWithChildren & {
  overrideDefault?: string[];
  additionalDefaults?: string[];
};

export default function RelaySelectionProvider({
  children,
  overrideDefault,
  additionalDefaults,
}: RelaySelectionProviderProps) {
  const relaysModal = useDisclosure();
  const { state } = useLocation();
  const navigate = useNavigate();

  const userReadRelays = useReadRelayUrls();
  const relays = useMemo(() => {
    if (state?.relays) return state.relays;
    if (overrideDefault) return overrideDefault;
    if (additionalDefaults) return unique([...userReadRelays, ...additionalDefaults]);
    return userReadRelays;
  }, [state?.relays, overrideDefault, userReadRelays, additionalDefaults]);

  const setSelected = useCallback((relays: string[]) => {
    navigate(".", { state: { relays }, replace: true });
  }, []);

  return (
    <RelaySelectionContext.Provider value={{ relays, setSelected, openModal: relaysModal.onOpen }}>
      {children}

      {relaysModal.isOpen && (
        <RelaySelectionModal selected={relays} onSubmit={setSelected} onClose={relaysModal.onClose} />
      )}
    </RelaySelectionContext.Provider>
  );
}
