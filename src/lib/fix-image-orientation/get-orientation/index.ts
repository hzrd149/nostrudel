import { getAndRemoveJpegOrientation } from "./jpeg";
import { getAndRemovePngOrientation } from "./png";

type Exif = { type: "image/jpeg" | "image/png"; orientation: number };

export const getOrientation = (dataView: DataView): Exif | undefined => {
  const jpegOrientation = getAndRemoveJpegOrientation(dataView);
  if (jpegOrientation != undefined) return { type: "image/jpeg", orientation: jpegOrientation };

  const pngOrientation = getAndRemovePngOrientation(dataView);
  if (pngOrientation != undefined) return { type: "image/png", orientation: pngOrientation };

  return undefined;
};
