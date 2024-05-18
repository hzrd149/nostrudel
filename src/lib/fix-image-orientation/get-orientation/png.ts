import { getAndRemoveTiffOrientation } from "./tiff";

const pngSignature = BigInt("0x89504e470d0a1a0a");
const headerLength = 8;
const crcLength = 4;
const pngExif = 0x65584966; // "eXIf"

export const getAndRemovePngOrientation = (dataView: DataView) => {
  if (dataView.getBigUint64(0) !== pngSignature) return undefined;

  let offset = 8;
  while (offset < dataView.byteLength) {
    const size = dataView.getUint32(offset);

    if (dataView.getUint32(offset + 4) === pngExif) return getAndRemoveTiffOrientation(dataView, offset + headerLength);

    offset += headerLength + size + crcLength;
  }

  return 0;
};
