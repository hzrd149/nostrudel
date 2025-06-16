import { useToast } from "@chakra-ui/react";
import { DecodeResult } from "applesauce-core/helpers";
import { nip19 } from "nostr-tools";
import { PropsWithChildren, createContext, useCallback, useMemo, useState } from "react";

import AppHandlerModal from "../../components/app-handler-modal";

type AppHandlerContextType = {
  openAddress(address: string): void;
};
export const AppHandlerContext = createContext<AppHandlerContextType>({
  openAddress() {
    throw new Error("AppHandler provider missing");
  },
});

export default function AppHandlerProvider({ children }: PropsWithChildren) {
  const toast = useToast();
  const [decoded, setDecoded] = useState<DecodeResult>();

  const openAddress = useCallback((address: string) => {
    try {
      setDecoded(nip19.decode(address));
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  }, []);

  const context = useMemo(
    () => ({
      openAddress,
    }),
    [openAddress],
  );

  return (
    <AppHandlerContext.Provider value={context}>
      {children}
      {decoded && <AppHandlerModal decoded={decoded} isOpen onClose={() => setDecoded(undefined)} />}
    </AppHandlerContext.Provider>
  );
}
