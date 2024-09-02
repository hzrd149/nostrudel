import { getAndRemoveTiffOrientation } from "./tiff";

const startOfImage = 0xffd8;
const app1Marker = 0xffe1;
const sosMarker = 0xffda;
const jpegExif = 0x45786966; // "Exif"

export const getAndRemoveJpegOrientation = (dataView: DataView) => {
  if (dataView.getUint16(0) !== startOfImage) return undefined;

  let offset = 2;
  while (offset < dataView.byteLength) {
    const tag = dataView.getUint16(offset);
    const length = dataView.getUint16(offset + 2);

    if (tag === sosMarker) return 0;

    if (tag === app1Marker) {
      if (dataView.getUint32(offset + 4) !== jpegExif || dataView.getUint16(offset + 8) !== 0x0) {
        return 0;
      }

      return getAndRemoveTiffOrientation(dataView, offset + 10);
    }

    offset += length + 2;
  }

  return 0;
};
