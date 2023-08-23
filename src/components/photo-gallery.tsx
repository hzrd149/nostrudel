import { useEffect, useMemo, useState } from "react";
import { Photo, PhotoAlbum, PhotoAlbumProps } from "react-photo-album";

type Size = { width: number; height: number };
const imageSizeCache = new Map<string, Size>();
function getImageSize(src: string): Promise<{ width: number; height: number }> {
  const cached = imageSizeCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((res, rej) => {
    const image = new Image();
    image.src = src;

    image.onload = () => {
      const size = { width: image.width, height: image.height };
      imageSizeCache.set(src, size);
      res(size);
    };
    image.onerror = (err) => rej(err);
  });
}

export type PhotoWithoutSize = Omit<Photo, "width" | "height"> & { width?: number; height?: number };

export default function PhotoGallery<T extends PhotoWithoutSize>({
  photos,
  ...props
}: Omit<PhotoAlbumProps<T & Size>, "photos"> & { photos: PhotoWithoutSize[] }) {
  const [loadedSizes, setLoadedSizes] = useState<Record<string, Size>>({});

  useEffect(() => {
    for (const photo of photos) {
      getImageSize(photo.src).then(
        (size) => {
          setLoadedSizes((dir) => ({ ...dir, [photo.src]: size }));
        },
        () => {},
      );
    }
  }, [photos]);

  const loadedPhotos = useMemo(() => {
    const loaded: (T & Size)[] = [];

    for (const photo of photos) {
      if (photo.width && photo.height) {
        loaded.push(photo as T & Size);
        continue;
      }

      const loadedImage = loadedSizes[photo.src];
      if (loadedImage) {
        loaded.push({ ...photo, width: loadedImage.width, height: loadedImage.height } as T & Size);
        continue;
      }
    }

    return loaded;
  }, [loadedSizes, photos]);

  return <PhotoAlbum<T & Size> photos={loadedPhotos} {...props} />;
}
