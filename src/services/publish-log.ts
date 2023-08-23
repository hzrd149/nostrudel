import type NostrPublishAction from "../classes/nostr-publish-action";
import { PersistentSubject } from "../classes/subject";

export function addToLog(pub: NostrPublishAction) {
  publishLog.next([...publishLog.value, pub]);
}

export function pruneLog() {}

export const publishLog = new PersistentSubject<NostrPublishAction[]>([]);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.publishLog = publishLog;
}
