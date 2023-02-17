import { useToast } from "@chakra-ui/react";
import React, { useCallback, useContext, useMemo } from "react";
import useSubject from "../hooks/use-subject";
import accountService from "../services/account";
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
  const current = useSubject(accountService.current);

  const requestSignature = useCallback(
    async (draft: DraftNostrEvent) => {
      try {
        if (!current) throw new Error("no account");
        return await signingService.requestSignature(draft, current);
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
