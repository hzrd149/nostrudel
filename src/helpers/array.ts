export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
export function random<T>(arr: T[]): T {
  return arr[Math.round(Math.random() * (arr.length - 1))];
}

// copied from https://stackoverflow.com/a/55200387
const byteToHex: string[] = [];
for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  byteToHex.push(hexOctet);
}
