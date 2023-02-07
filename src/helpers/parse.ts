export function safeUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch (e) {}
}

export function safeJson<T>(json: string, fallback: T) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return fallback;
  }
}
