import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef } from "react";
import { nanoid } from "nanoid";

import Subject from "../../classes/subject";
import { useSigningContext } from "./signing-provider";
import useSubject from "../../hooks/use-subject";
import createDefer, { Deferred } from "../../classes/deferred";
import { NostrEvent } from "../../types/nostr-event";
import useCurrentAccount from "../../hooks/use-current-account";
import { getDMRecipient, getDMSender } from "../../helpers/nostr/dms";

class DecryptionContainer {
  id = nanoid();
  pubkey: string;
  data: string;

  plaintext = new Subject<string>();
  error = new Subject<Error>();

  constructor(pubkey: string, data: string) {
    this.pubkey = pubkey;
    this.data = data;
  }
}

type DecryptionContextType = {
  getOrCreateContainer: (pubkey: string, data: string) => DecryptionContainer;
  startQueue: () => void;
  clearQueue: () => void;
  addToQueue: (container: DecryptionContainer) => Promise<string>;
  getQueue: () => DecryptionContainer[];
};
const DecryptionContext = createContext<DecryptionContextType>({
  getOrCreateContainer: () => {
    throw new Error("No DecryptionProvider");
  },
  startQueue: () => {},
  clearQueue: () => {},
  addToQueue: () => Promise.reject(new Error("No DecryptionProvider")),
  getQueue: () => [],
});

export function useDecryptionContext() {
  return useContext(DecryptionContext);
}
export function useDecryptionContainer(pubkey: string, data: string) {
  const { getOrCreateContainer, addToQueue, startQueue } = useContext(DecryptionContext);
  const container = getOrCreateContainer(pubkey, data);

  const plaintext = useSubject(container.plaintext);
  const error = useSubject(container.error);

  const requestDecrypt = useCallback(() => {
    const p = addToQueue(container);
    startQueue();
    return p;
  }, [addToQueue, startQueue]);

  return { container, error, plaintext, requestDecrypt };
}

export default function DecryptionProvider({ children }: PropsWithChildren) {
  const { requestDecrypt } = useSigningContext();

  const containers = useRef<DecryptionContainer[]>([]);
  const queue = useRef<DecryptionContainer[]>([]);
  const promises = useRef<Map<DecryptionContainer, Deferred<string>>>(new Map());
  const running = useRef<boolean>(false);

  const getQueue = useCallback(() => queue.current, []);
  const clearQueue = useCallback(() => {
    queue.current = [];
    promises.current.clear();
  }, []);
  const addToQueue = useCallback((container: DecryptionContainer) => {
    queue.current.unshift(container);
    let p = promises.current.get(container);
    if (!p) {
      p = createDefer<string>();
      promises.current.set(container, p);
    }
    return p;
  }, []);

  const getOrCreateContainer = useCallback((pubkey: string, data: string) => {
    let container = containers.current.find((c) => c.pubkey === pubkey && c.data === data);
    if (!container) {
      container = new DecryptionContainer(pubkey, data);
      containers.current.push(container);
    }
    return container;
  }, []);

  const startQueue = useCallback(() => {
    if (running.current === true) return;
    running.current = false;

    async function decryptNext() {
      if (running.current === true) return;

      const container = queue.current.pop();
      if (!container) {
        running.current = false;
        promises.current.clear();
        return;
      }

      const promise = promises.current.get(container)!;

      try {
        const plaintext = await requestDecrypt(container.data, container.pubkey);

        // set plaintext
        container.plaintext.next(plaintext);
        promise.resolve(plaintext);

        // remove promise
        promises.current.delete(container);

        setTimeout(() => decryptNext(), 100);
      } catch (e) {
        if (e instanceof Error) {
          // set error
          container.error.next(e);
          promise.reject(e);

          // clear queue
          running.current = false;
          queue.current = [];
          promises.current.clear();
        }
      }
    }

    // start cycle
    decryptNext();
  }, [requestDecrypt]);

  const context = useMemo(
    () => ({ getQueue, addToQueue, clearQueue, getOrCreateContainer, startQueue }),
    [getQueue, addToQueue, clearQueue, getOrCreateContainer, startQueue],
  );

  return <DecryptionContext.Provider value={context}>{children}</DecryptionContext.Provider>;
}
