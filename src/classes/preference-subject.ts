import { BehaviorSubject } from "rxjs";
import { Preferences } from "@capacitor/preferences";
import { safeParse } from "applesauce-core/helpers";

export type PreferencesSubjectOptions<T = string> = {
  decode?: (raw: string) => T;
  encode?: (value: T) => string | null;
  saveDefault?: boolean;
};

export class PreferenceSubject<T = string> extends BehaviorSubject<T> {
  saveDefault = false;

  decode?: (raw: string) => T;
  encode?: (value: T) => string | null;

  constructor(
    public key: string,
    value: T,
    public fallback: T,
    opts?: PreferencesSubjectOptions<T>,
  ) {
    super(value);

    this.key = key;
    this.decode = opts?.decode;
    this.encode = opts?.encode;
    this.fallback = fallback;
  }

  async next(value: T) {
    await this.save(value);
    super.next(value);
  }

  clear() {
    localStorage.removeItem(this.key);
    super.next(this.fallback);
  }

  async save(value: T = this.value) {
    const encoded = this.encode ? this.encode(value) : String(value);
    if (!encoded) throw new Error("encode can not return null when saveDefault is set");
    await Preferences.set({ key: this.key, value: encoded });
  }

  static async load<T>(key: string, fallback: T, opts?: PreferencesSubjectOptions<T>): Promise<T> {
    let value = fallback;
    const { value: raw } = await Preferences.get({ key });
    if (raw) {
      value = opts?.decode ? opts.decode(raw) : (raw as T);
    } else if (opts?.saveDefault) {
      const encoded = opts?.encode ? opts.encode(value) : String(value);
      if (!encoded) throw new Error("encode can not return null when saveDefault is set");
      await Preferences.set({ key, value: encoded });
    }

    return value;
  }

  static async create<T>(key: string, fallback: T, opts?: PreferencesSubjectOptions<T>) {
    const value = await this.load(key, fallback, opts);
    return new PreferenceSubject<T>(key, value, fallback, opts);
  }

  /** Creates a string entry */
  static async string(key: string, fallback: string, opts?: PreferencesSubjectOptions<string>) {
    return PreferenceSubject.create<string>(key, fallback, opts);
  }

  /** Creates a nullable string entry */
  static async stringNullable(
    key: string,
    fallback: string | null = null,
    opts?: PreferencesSubjectOptions<string | null>,
  ) {
    return PreferenceSubject.create<string | null>(key, fallback, opts);
  }

  /** Creates a boolean entry */
  static async boolean(
    key: string,
    fallback: boolean,
    opts?: Omit<PreferencesSubjectOptions<boolean>, "decode" | "encode">,
  ) {
    return PreferenceSubject.create<boolean>(key, fallback, {
      ...opts,
      decode: (raw) => raw === "true",
      encode: (value) => String(value),
    });
  }

  /** Creates a number entry */
  static async number(
    key: string,
    fallback: number,
    opts?: Omit<PreferencesSubjectOptions<number>, "decode" | "encode">,
  ) {
    return PreferenceSubject.create<number>(key, fallback, {
      ...opts,
      decode: (raw) => parseInt(raw),
      encode: (value) => String(value),
    });
  }

  /** Creates a nullable number entry */
  static async numberNullable(
    key: string,
    fallback: number | null = null,
    opts?: Omit<PreferencesSubjectOptions<number | null>, "decode" | "encode">,
  ) {
    return PreferenceSubject.create<number | null>(key, fallback, opts);
  }

  /** Creates an array of values */
  static async array<T>(key: string, fallback: T[], opts?: Omit<PreferencesSubjectOptions<T[]>, "decode" | "encode">) {
    return PreferenceSubject.create<T[]>(key, fallback, {
      ...opts,
      decode: (raw) => {
        const value = safeParse<T[]>(raw);
        if (value && Array.isArray(value)) return value;
        else return [] as T[];
      },
      encode: (value) => JSON.stringify(value),
    });
  }
}
