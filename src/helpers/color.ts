// based on https://stackoverflow.com/a/3943023
export function getTextColor(background: string | number) {
  if (typeof background === "string") background = parseInt(background, 16);
  const red = background & 0xff;
  const green = background & 0x00ff;
  const blue = background & 0x0000ff;
  if (red * 0.299 + green * 0.587 + blue * 0.114 > 186) return "dark";
  return "light";
}
