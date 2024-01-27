import { useToast } from "@chakra-ui/react";
import React, { useCallback, useContext, useMemo } from "react";
import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";
import signingService from "../../services/signing";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";

export type SigningContextType = {
  requestSignature: (draft: DraftNostrEvent) => Promise<NostrEvent>;
  requestDecrypt: (data: string, pubkey: string) => Promise<string>;
  requestEncrypt: (data: string, pubkey: string) => Promise<string>;
};

export const SigningContext = React.createContext<SigningContextType>({
  requestSignature: () => {
    throw new Error("not setup yet");
  },
  requestDecrypt: () => {
    throw new Error("not setup yet");
  },
  requestEncrypt: () => {
    throw new Error("not setup yet");
  },
});

export function useSigningContext() {
  return useContext(SigningContext);
}

export function SigningProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const current = useSubject(accountService.current);

  const requestSignature = useCallback(
    async (draft: DraftNostrEvent) => {
      if (!current) throw new Error("No account");
      return await signingService.requestSignature(draft, current);
    },
    [toast, current],
  );
  const requestDecrypt = useCallback(
    async (data: string, pubkey: string) => {
      if (!current) throw new Error("No account");
      return await signingService.requestDecrypt(data, pubkey, current);
    },
    [toast, current],
  );
  const requestEncrypt = useCallback(
    async (data: string, pubkey: string) => {
      if (!current) throw new Error("No account");
      return await signingService.requestEncrypt(data, pubkey, current);
    },
    [toast, current],
  );

  const context = useMemo(
    () => ({ requestSignature, requestDecrypt, requestEncrypt }),
    [requestSignature, requestDecrypt, requestEncrypt],
  );

  return <SigningContext.Provider value={context}>{children}</SigningContext.Provider>;
}
