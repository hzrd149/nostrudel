import { useToast } from "@chakra-ui/react";
import React, { useCallback, useContext, useMemo } from "react";
import signingService from "../services/signing";
import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";

export type SigningContextType = {
  requestSignature: (draft: DraftNostrEvent) => Promise<NostrEvent | undefined>;
};

export const SigningContext = React.createContext<SigningContextType>({
  requestSignature: () => {
    throw new Error("not setup yet");
  },
});

export function useSigningContext() {
  return useContext(SigningContext);
}

export const SigningProvider = ({ children }: { children: React.ReactNode }) => {
  const toast = useToast();

  const requestSignature = useCallback(
    async (draft: DraftNostrEvent) => {
      try {
        return await signingService.requestSignature(draft);
      } catch (e) {
        if (e instanceof Error) {
          toast({
            status: "error",
            description: e.message,
          });
        }
      }
    },
    [toast]
  );
  const context = useMemo(() => ({ requestSignature }), [requestSignature]);

  return <SigningContext.Provider value={context}>{children}</SigningContext.Provider>;
};
