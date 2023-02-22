export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
export function random<T>(arr: T[]): T {
  return arr[Math.round(Math.random() * (arr.length - 1))];
}
