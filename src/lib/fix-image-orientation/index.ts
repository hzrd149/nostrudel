import { readFileAsArrayBuffer } from "../../helpers/file";
import { getOrientation } from "./get-orientation";

const createImage = (src: string) => {
  const image = new Image();

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = src;
  });
};

async function createTransformed(file: Blob | File, orientation: number, type: string) {
  const objectURL = URL.createObjectURL(file);
  const image = await createImage(objectURL);

  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  if (context == undefined) throw new Error("undefined context");

  context.drawImage(image, 0, 0);
  URL.revokeObjectURL(objectURL);

  const blob = await canvas.convertToBlob({ type });

  if (file instanceof File) return new File([blob], file.name, { type: blob.type });
  else return blob;
}

export async function fixOrientationAndStripMetadata(file: File | Blob) {
  const buffer = await readFileAsArrayBuffer(file);
  const exif = getOrientation(new DataView(buffer));

  if (exif === undefined) return file;

  return createTransformed(file, exif.orientation, file.type || exif.type);
}
