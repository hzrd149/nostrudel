import { BehaviorSubject } from "rxjs";

export class PubkeySubjectCache<T> {
  subjects = new Map<string, BehaviorSubject<T | null>>();

  hasSubject(pubkey: string) {
    return this.subjects.has(pubkey);
  }
  getSubject(pubkey: string) {
    let subject = this.subjects.get(pubkey);
    if (!subject) {
      subject = new BehaviorSubject<T | null>(null);
      this.subjects.set(pubkey, subject);
    }
    return subject;
  }

  prune() {
    const prunedKeys: string[] = [];
    for (const [key, subject] of this.subjects) {
      if (!subject.observed) {
        this.subjects.delete(key);
        prunedKeys.push(key);
      }
    }
    return prunedKeys;
  }
}
