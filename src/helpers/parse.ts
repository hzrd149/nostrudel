export function safeUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch (e) {}
}
