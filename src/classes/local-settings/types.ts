import { LocalStorageEntry, NullableLocalStorageEntry } from "./entry";

export class NumberLocalStorageEntry extends LocalStorageEntry<number> {
  constructor(key: string, fallback: number) {
    super(
      key,
      fallback,
      (raw) => parseInt(raw),
      (value) => String(value),
    );
  }
}

export class NullableNumberLocalStorageEntry extends NullableLocalStorageEntry<number> {
  constructor(key: string, fallback: number) {
    super(
      key,
      fallback,
      (raw) => (raw !== null ? parseInt(raw) : raw),
      (value) => String(value),
    );
  }
}

export class BooleanLocalStorageEntry extends LocalStorageEntry<boolean> {
  constructor(key: string, fallback: boolean) {
    super(
      key,
      fallback,
      (raw) => raw === "true",
      (value) => String(value),
    );
  }
}
