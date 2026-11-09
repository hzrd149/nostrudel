import { ReadonlyAccount } from "applesauce-accounts/accounts";
import type { GiftWrapProcessingRecord } from "applesauce-extra/gift-wrap";
import localforage from "localforage";
import { asapScheduler, combineLatest, Observable, of, shareReplay, subscribeOn, switchMap } from "rxjs";

import { logger } from "../../helpers/debug";
import EncryptedStorage from "../../classes/encrypted-storage";
import { isSignerRejection } from "../../helpers/nostr/gift-wrap-decryption";
import accounts from "../accounts";
import { decryptionCache$ } from "../decryption-cache";
import { cacheRequest } from "../event-cache";
import { eventStore } from "../event-store";
import pool from "../pool";
import localSettings from "../preferences";
import { MessagingSession } from "./session";

const log = logger.extend("Messaging");

export const messaging$ = combineLatest([accounts.active$, decryptionCache$]).pipe(
  switchMap(([account, cache]) => {
    if (!account) return of(undefined);
    const locked = cache instanceof EncryptedStorage && !cache.unlocked;
    return new Observable<MessagingSession>((subscriber) => {
      const storage = localforage.createInstance({ name: "messaging", storeName: `account_${account.pubkey}` });
      const options = {
        pubkey: account.pubkey,
        signer: account instanceof ReadonlyAccount ? undefined : account,
        eventStore,
        pool,
        cacheRequest,
        decryptionCache: !locked && cache ? cache : undefined,
        authTimeout: false as const,
      };
      const session = new MessagingSession(
        {
          ...options,
          fallbackRelays: localSettings.fallbackRelays,
          mirrorExpiration: false,
          draftStorage: localforage.createInstance({ name: "message-drafts", storeName: `legacy_${account.pubkey}` }),
        },
        {
          ...options,
          draftStorage: localforage.createInstance({ name: "message-drafts", storeName: `wrapped_${account.pubkey}` }),
          receiverOptions: {
            decryptionConcurrency: 1,
            processingConcurrency: 1,
            processingStore: {
              async list() {
                const records: GiftWrapProcessingRecord[] = [];
                await storage.iterate<GiftWrapProcessingRecord, void>((record) => {
                  records.push(record);
                });
                return records;
              },
              async set(record) {
                await storage.setItem(record.eventId, record);
              },
            },
            retryPolicy: {
              classify: (error) => ({
                code: isSignerRejection(error) ? "signer-rejected" : "decryption-failed",
                retry: "manual",
              }),
            },
          },
        },
      );
      session.add(
        localSettings.autoDecryptMessages.subscribe((enabled) =>
          session.setAutoUnlock(enabled && !locked && !!options.signer),
        ),
      );
      session.add(
        session.wrapped.receiver.errors$.subscribe((failure) => {
          log("Wrapped message failure", failure);
          if (failure.failure?.code === "signer-rejected") session.wrapped.setAutoUnlock(false);
          if (failure.operation !== "decrypt") session.report(failure.error);
        }),
      );
      session.add(
        session.legacy.receiver.errors$.subscribe((failure) => {
          log("Legacy message failure", failure);
          if (failure.operation !== "decrypt") session.report(failure.error);
          else if (isSignerRejection(failure.error)) session.legacy.setAutoUnlock(false);
        }),
      );
      session.add(session.wrapped.errors$.subscribe((failure) => log("Messaging failure", failure)));
      subscriber.next(session);
      void session.start().catch((error) => {
        if (!subscriber.closed) {
          log("Unable to start messaging", error);
          session.report(error);
        }
      });
      return () => session.dispose();
    });
  }),
  subscribeOn(asapScheduler),
  // Keep receiving and prepared retries alive after leaving the messages view; account changes dispose the session.
  shareReplay({ bufferSize: 1, refCount: false }),
);
