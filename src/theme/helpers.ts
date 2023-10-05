export function pallet(colors: string[]) {
  return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].reduce(
    (pallet, key, i) => ({ ...pallet, [key]: colors[i] }),
    {},
  );
}
