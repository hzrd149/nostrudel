import { readFileAsArrayBuffer } from "../../helpers/file";
import { getOrientation } from "./get-orientation";

const noTransformOrientations = new Set([0, 1]);
const reversedAspectRatioOrientations = new Set([5, 6, 7, 8]);
const transformsByOrientation: Record<number, (image: HTMLImageElement, context: CanvasRenderingContext2D) => void> = {
  2: (image, context) => context.transform(-1, 0, 0, 1, image.width, 0),
  3: (image, context) => context.transform(-1, 0, 0, -1, image.width, image.height),
  4: (image, context) => context.transform(1, 0, 0, -1, 0, image.height),
  5: (_image, context) => context.transform(0, 1, 1, 0, 0, 0),
  6: (image, context) => context.transform(0, 1, -1, 0, image.height, 0),
  7: (image, context) => context.transform(0, -1, -1, 0, image.height, image.width),
  8: (image, context) => context.transform(0, -1, 1, 0, 0, image.width),
};

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

  // NOTE: for some unknown reason firefox and chrome seem to be handling the orientation... so no need to transform
  // if (!noTransformOrientations.has(orientation)) {
  //   if (reversedAspectRatioOrientations.has(orientation)) {
  //     canvas.width = image.height;
  //     canvas.height = image.width;
  //   } else {
  //     canvas.width = image.width;
  //     canvas.height = image.height;
  //   }
  //   transformsByOrientation[orientation](image, context);
  // }
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
