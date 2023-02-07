export function debounce<T>(func: T, timeout = 300) {
  let timer: number | undefined;
  return (...args: any[]) => {
    clearTimeout(timer);
    // @ts-ignore
    timer = setTimeout(() => func(args), timeout);
  };
}
