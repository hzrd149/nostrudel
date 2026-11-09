import { describe, expect, it } from "vitest";
import { MessageCipher, openMessageCipher } from "../storage";

describe("messaging storage encryption", () => {
  it("shares one first-use key when startup opens concurrently", async () => {
    const entries = new Map<string, string>();
    let writes = 0;
    const cache = {
      getItem: async (key: string) => entries.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        writes++;
        entries.set(key, value);
      },
    };
    const [first, second] = await Promise.all([openMessageCipher(cache, "alice"), openMessageCipher(cache, "alice")]);
    expect(first.namespace).toBe(second.namespace);
    expect(writes).toBe(1);
  });
  it("restores an account key, separates accounts and rotates namespaces when the cache is cleared", async () => {
    const entries = new Map<string, string>();
    const cache = {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
    };
    const first = await openMessageCipher(cache, "alice");
    const bytes = new TextEncoder().encode("private message and file key");
    const encrypted = first.cipher.encrypt(bytes);
    expect(new TextDecoder().decode(encrypted.ciphertext)).not.toContain("private message");
    const restored = await openMessageCipher(cache, "alice");
    expect(restored.namespace).toBe(first.namespace);
    expect(restored.cipher.decrypt(encrypted)).toEqual(bytes);
    const other = await openMessageCipher(cache, "bob");
    expect(() => other.cipher.decrypt(encrypted)).toThrow();
    entries.clear();
    expect((await openMessageCipher(cache, "alice")).namespace).not.toBe(first.namespace);
  });

  it("rejects tampered ciphertext and storage that silently refuses the key write", async () => {
    const cipher = new MessageCipher(new Uint8Array(32).fill(1));
    const encrypted = cipher.encrypt(new Uint8Array([1, 2, 3]));
    encrypted.ciphertext[0] ^= 1;
    expect(() => cipher.decrypt(encrypted)).toThrow();
    await expect(openMessageCipher({ getItem: () => null, setItem: async () => false }, "alice")).rejects.toThrow(
      "Unable to save",
    );
  });
});
