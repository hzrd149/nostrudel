import React, { useCallback, useContext, useMemo } from "react";
import { EventTemplate, UnsignedEvent, VerifiedEvent } from "nostr-tools";
import { useActiveAccount } from "applesauce-react/hooks";
import { useToast } from "@chakra-ui/react";

import signingService from "../../services/signing";

export type SigningContextType = {
  finalizeDraft(draft: EventTemplate): Promise<UnsignedEvent>;
  requestSignature(draft: UnsignedEvent | EventTemplate): Promise<VerifiedEvent>;
  requestDecrypt(data: string, pubkey: string): Promise<string>;
  requestEncrypt(data: string, pubkey: string): Promise<string>;
};

export const SigningContext = React.createContext<SigningContextType>({
  finalizeDraft: () => {
    throw new Error("not setup yet");
  },
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
  const account = useActiveAccount();

  const finalizeDraft = useCallback(
    async (draft: EventTemplate) => {
      if (!account) throw new Error("No account");
      return await signingService.finalizeDraft(draft, account);
    },
    [toast, account],
  );
  const requestSignature = useCallback(
    async (draft: UnsignedEvent) => {
      if (!account) throw new Error("No account");
      return await signingService.requestSignature(draft, account);
    },
    [toast, account],
  );
  const requestDecrypt = useCallback(
    async (data: string, pubkey: string) => {
      if (!account) throw new Error("No account");
      return await signingService.nip04Decrypt(data, pubkey, account);
    },
    [toast, account],
  );
  const requestEncrypt = useCallback(
    async (data: string, pubkey: string) => {
      if (!account) throw new Error("No account");
      return await signingService.nip04Encrypt(data, pubkey, account);
    },
    [toast, account],
  );

  const context = useMemo(
    () => ({ requestSignature, requestDecrypt, requestEncrypt, finalizeDraft }),
    [requestSignature, requestDecrypt, requestEncrypt, finalizeDraft],
  );

  return <SigningContext.Provider value={context}>{children}</SigningContext.Provider>;
}
