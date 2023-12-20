import { Box, BoxProps } from "@chakra-ui/react";
import { decode } from "blurhash";
import { useEffect, useRef } from "react";

export type BlurhashImageProps = {
  blurhash: string;
  width: number;
  height: number;
} & Omit<BoxProps, "width" | "height" | "children">;

export default function BlurhashImage({ blurhash, width, height, ...props }: BlurhashImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.canvas.width = width;
    ctx.canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const pixels = decode(blurhash, width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  }, [blurhash, width, height]);

  return <Box as="canvas" ref={canvasRef} {...props} />;
}
