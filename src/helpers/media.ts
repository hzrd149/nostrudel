/** Pauses every media element except `current`, so only one plays at a time */
export function pauseOthers<T extends Pick<HTMLMediaElement, "paused" | "pause">>(current: T, elements: Iterable<T>) {
  for (const element of elements) {
    if (element !== current && !element.paused) element.pause();
  }
}
