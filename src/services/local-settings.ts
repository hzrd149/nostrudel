import { PersistentSubject } from "../classes/subject";

class NullableLocalStorageEntry<T = string> extends PersistentSubject<T | null> {
  key: string;
  decode?: (raw: string | null) => T | null;
  encode?: (value: T) => string | null;

  constructor(
    key: string,
    initValue: T | null = null,
    decode?: (raw: string | null) => T | null,
    encode?: (value: T) => string | null,
  ) {
    let value = initValue;
    if (localStorage.hasOwnProperty(key)) {
      const raw = localStorage.getItem(key);

      if (decode) value = decode(raw);
      else value = raw as T | null;
    }

    super(value);
    this.key = key;
    this.decode = decode;
    this.encode = encode;
  }

  next(value: T | null) {
    if (value === null) {
      localStorage.removeItem(this.key);

      super.next(value);
    } else {
      const encoded = this.encode ? this.encode(value) : String(value);
      if (encoded !== null) localStorage.setItem(this.key, encoded);
      else localStorage.removeItem(this.key);

      super.next(value);
    }
  }

  clear() {
    this.next(null);
  }
}
class LocalStorageEntry<T = string> extends PersistentSubject<T> {
  key: string;
  fallback: T;
  decode?: (raw: string) => T;
  encode?: (value: T) => string | null;

  constructor(key: string, fallback: T, decode?: (raw: string) => T, encode?: (value: T) => string | null) {
    let value = fallback;
    if (localStorage.hasOwnProperty(key)) {
      const raw = localStorage.getItem(key);

      if (decode && raw) value = decode(raw);
      else if (raw) value = raw as T;
    }

    super(value);
    this.key = key;
    this.decode = decode;
    this.encode = encode;
    this.fallback = fallback;
  }

  next(value: T) {
    const encoded = this.encode ? this.encode(value) : String(value);
    if (encoded !== null) localStorage.setItem(this.key, encoded);
    else localStorage.removeItem(this.key);

    super.next(value);
  }

  clear() {
    localStorage.removeItem(this.key);
    super.next(this.fallback);
  }
}

class NumberLocalStorageEntry extends LocalStorageEntry<number> {
  constructor(key: string, fallback: number) {
    super(
      key,
      fallback,
      (raw) => parseInt(raw),
      (value) => String(value),
    );
  }
}
class NullableNumberLocalStorageEntry extends NullableLocalStorageEntry<number> {
  constructor(key: string, fallback: number) {
    super(
      key,
      fallback,
      (raw) => (raw !== null ? parseInt(raw) : raw),
      (value) => String(value),
    );
  }
}

// local relay
const idbMaxEvents = new NumberLocalStorageEntry("nostr-idb-max-events", 10_000);
const wasmPersistForDays = new NullableNumberLocalStorageEntry("wasm-relay-oldest-event", 365);

// note behavior
const enableNoteThreadDrawer = new LocalStorageEntry(
  "enable-note-thread-drawer",
  false,
  (raw) => raw === "true",
  (v) => String(v),
);

const localSettings = {
  idbMaxEvents,
  wasmPersistForDays,
  enableNoteThreadDrawer,
};

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.localSettings = localSettings;
}

export default localSettings;
