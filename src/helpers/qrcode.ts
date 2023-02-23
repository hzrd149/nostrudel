import { QrCode } from "../lib/qrcodegen";

export function drawSvgPath(qr: QrCode, border: number): string {
  if (border < 0) throw new RangeError("Border must be non-negative");
  let parts: Array<string> = [];
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) parts.push(`M${x + border},${y + border}h1v1h-1z`);
    }
  }
  return parts.join(" ");
}
