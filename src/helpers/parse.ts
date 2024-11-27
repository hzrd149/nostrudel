export function safeUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch (e) {}
}

export function safeJson<T>(json: string): T | undefined;
export function safeJson<T>(json: string, fallback: T): T;
export function safeJson<T>(json: string, fallback?: T): T | undefined {
  try {
    return JSON.parse(json);
  } catch (e) {
    return fallback;
  }
}
