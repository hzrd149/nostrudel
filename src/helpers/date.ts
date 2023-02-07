export function convertTimestampToDate(timestamp: number) {
  return new Date(timestamp * 1000);
}
