const typeShort = 3;

const littleEndian = 0x4949;
const bigEndian = 0x4d4d;
const orientationTag = 0x0112;

const getIsLittleEndian = (byte: number) => {
  switch (byte) {
    case littleEndian:
      return true;
    case bigEndian:
      return false;
    default:
      throw new Error("unexpected byte order");
  }
};

export const getAndRemoveTiffOrientation = (dataView: DataView, offset: number) => {
  const isLittleEndian = getIsLittleEndian(dataView.getUint16(offset));

  const ifd0Offset = dataView.getUint32(offset + 4, isLittleEndian);
  const entriesCount = dataView.getUint16(offset + ifd0Offset, isLittleEndian);

  let entryOffset = offset + ifd0Offset + 2;
  for (let i = 0; i < entriesCount; i++) {
    const tag = dataView.getUint16(entryOffset, isLittleEndian);

    if (tag !== orientationTag) {
      entryOffset += 12;
      continue;
    }

    const type = dataView.getUint16(entryOffset + 2, isLittleEndian);
    const valueCount = dataView.getUint32(entryOffset + 4, isLittleEndian);

    if (type !== typeShort || valueCount !== 1) return 0;

    const orientation = dataView.getUint16(entryOffset + 8, isLittleEndian);
    dataView.setUint16(entryOffset + 8, 1);

    return orientation;
  }

  return 0;
};
