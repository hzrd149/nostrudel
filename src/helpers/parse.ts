export function safeUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch {
    // Not a parseable URL; callers treat undefined as "no URL"
    return undefined;
  }
}
