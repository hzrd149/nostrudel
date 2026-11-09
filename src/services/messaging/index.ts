import { ReadonlyAccount } from "applesauce-accounts/accounts";
import {
  asapScheduler,
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  shareReplay,
  subscribeOn,
  switchMap,
} from "rxjs";

import EncryptedStorage from "../../classes/encrypted-storage";
import { logger } from "../../helpers/debug";
import { isSignerRejection } from "../../helpers/nostr/gift-wrap-decryption";
import accounts from "../accounts";
import { decryptionCache$ } from "../decryption-cache";
import { cacheRequest } from "../event-cache";
import { eventStore } from "../event-store";
import pool from "../pool";
import localSettings from "../preferences";
import { openMessagingResources } from "./resources";
import { MessagingSession } from "./session";
import { createMessageUploader } from "./upload";

const log = logger.extend("Messaging");
export const messagingStartupError$ = new BehaviorSubject<string | undefined>(undefined);

export const messaging$ = combineLatest([accounts.active$, decryptionCache$]).pipe(
  switchMap(([account, cache]) => {
    log("Account/storage changed", account?.pubkey, cache instanceof EncryptedStorage ? cache.unlocked : !!cache);
    messagingStartupError$.next(undefined);
    if (!account || (cache instanceof EncryptedStorage && !cache.unlocked)) return of(undefined);
    return new Observable<MessagingSession | undefined>((subscriber) => {
      const lifetime = new AbortController();
      let resources: Awaited<ReturnType<typeof openMessagingResources>> | undefined;
      let session: MessagingSession | undefined;
      subscriber.next(undefined);
      const start = async () => {
        log("Opening message storage", account.pubkey);
        if (cache) resources = await openMessagingResources(cache, account.pubkey, lifetime.signal);
        if (lifetime.signal.aborted) {
          resources?.close();
          return;
        }
        const signer = account instanceof ReadonlyAccount ? undefined : account;
        const options = {
          pubkey: account.pubkey,
          signer,
          eventStore,
          pool,
          cacheRequest,
          decryptionCache: cache ?? undefined,
          authTimeout: false as const,
        };
        session = new MessagingSession(
          {
            ...options,
            fallbackRelays: localSettings.fallbackRelays,
            mirrorExpiration: false,
            conversationIndex: resources?.legacyIndex,
            draftStorage: resources?.legacyDrafts.strings,
          },
          {
            ...options,
            rumorStore: resources?.rumorStore,
            conversationIndex: resources?.wrappedIndex,
            draftStorage: resources?.wrappedDrafts.strings,
            draftFileStorage: resources?.wrappedDrafts.files,
            upload: signer ? createMessageUploader(signer, account.pubkey, eventStore) : undefined,
            receiverOptions: {
              decryptionConcurrency: 1,
              processingConcurrency: 1,
              processingStore: resources?.processingStore,
              retryPolicy: {
                classify: (error) => ({
                  code: isSignerRejection(error) ? "signer-rejected" : "decryption-failed",
                  retry: "manual",
                }),
              },
            },
          },
        );
        const current = session;
        current.add(
          current.legacy.conversationIndexError$.subscribe((error) => {
            if (error) current.report(error);
          }),
        );
        current.add(
          current.legacy.cacheError$.subscribe((error) => {
            if (error) current.report(error);
          }),
        );
        current.add(
          localSettings.autoDecryptMessages.subscribe((enabled) => current.setAutoUnlock(enabled && !!signer)),
        );
        current.add(
          current.wrapped.receiver.errors$.subscribe((failure) => {
            log("Wrapped message failure", failure);
            if (failure.failure?.code === "signer-rejected") current.wrapped.setAutoUnlock(false);
            if (failure.operation !== "decrypt") current.report(failure.error);
          }),
        );
        current.add(
          current.legacy.receiver.errors$.subscribe((failure) => {
            log("Legacy message failure", failure);
            if (failure.operation !== "decrypt") current.report(failure.error);
            else if (isSignerRejection(failure.error)) current.legacy.setAutoUnlock(false);
          }),
        );
        current.add(
          current.wrapped.errors$.subscribe((failure) => {
            log("Messaging failure", failure);
            current.report(failure.error);
          }),
        );
        subscriber.next(current);
        await current.start();
      };
      void start().catch((error) => {
        if (lifetime.signal.aborted) return;
        log("Unable to start messaging", error);
        if (session) session.report(error);
        else messagingStartupError$.next(error instanceof Error ? error.message : String(error));
      });
      return () => {
        lifetime.abort();
        session?.dispose();
        resources?.close();
      };
    });
  }),
  subscribeOn(asapScheduler),
  // Account/cache changes dispose the clients; navigating away does not interrupt sends or reception.
  shareReplay({ bufferSize: 1, refCount: false }),
);
