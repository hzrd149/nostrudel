export function safeParse<T>(json: string, fallback: T) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return fallback;
  }
}
