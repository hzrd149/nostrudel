import { useMemo } from "react";
import { drawSvgPath } from "../helpers/qrcode";
import { Ecc, QrCode } from "../lib/qrcodegen";

export default function QrCodeSvg({
  content,
  lightColor = "white",
  darkColor = "black",
  border = 2,
}: {
  content: string;
  lightColor?: string;
  darkColor?: string;
  border?: number;
}) {
  const qrCode = useMemo(() => QrCode.encodeText(content, Ecc.LOW), [content]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox={`0 0 ${qrCode.size + border * 2} ${qrCode.size + border * 2}`}
      stroke="none"
    >
      <rect width="100%" height="100%" fill={lightColor} />
      <path d={drawSvgPath(qrCode, border)} fill={darkColor} />
    </svg>
  );
}
