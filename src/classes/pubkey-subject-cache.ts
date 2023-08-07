import Subject from "./subject";

/** @deprecated */
export class PubkeySubjectCache<T> {
  subjects = new Map<string, Subject<T | null>>();
  relays = new Map<string, Set<string>>();
  dirty = false;

  hasSubject(pubkey: string) {
    return this.subjects.has(pubkey);
  }
  getSubject(pubkey: string) {
    let subject = this.subjects.get(pubkey);
    if (!subject) {
      subject = new Subject<T | null>(null);
      this.subjects.set(pubkey, subject);
      this.dirty = true;
    }
    return subject;
  }
  addRelays(pubkey: string, relays: string[]) {
    const set = this.relays.get(pubkey) ?? new Set();
    for (const url of relays) set.add(url);
    this.relays.set(pubkey, set);
    this.dirty = true;
  }

  getAllPubkeysMissingData(include: string[] = []) {
    const pubkeys: string[] = [];
    const relays = new Set<string>();

    for (const [pubkey, subject] of this.subjects) {
      if (subject.value === null || include.includes(pubkey)) {
        pubkeys.push(pubkey);
        const r = this.relays.get(pubkey);
        if (r) {
          for (const url of r) relays.add(url);
        }
      }
    }
    return { pubkeys, relays: Array.from(relays) };
  }

  prune() {
    const prunedKeys: string[] = [];
    for (const [key, subject] of this.subjects) {
      if (!subject.hasListeners) {
        this.subjects.delete(key);
        this.relays.delete(key);
        prunedKeys.push(key);
        this.dirty = true;
      }
    }
    return prunedKeys;
  }
}
