import { useRef } from "react";
import { Button, ButtonGroup, Flex, useToast } from "@chakra-ui/react";

import STLViewer from "../../../components/stl-viewer";
import useObjectURL from "../../../hooks/use-object-url";
import BackButton from "../../../components/back-button";

type FormValues = {
  screenshot: Blob;
};

function canvasToBlob(canvas: HTMLCanvasElement, type?: string): Promise<Blob> {
  return new Promise((res, rej) => {
    canvas.toBlob((blob) => {
      if (blob) res(blob);
      else rej(new Error("Failed to get blob"));
    }, type);
  });
}

export default function PreviewStep({ file, onSubmit }: { file: Blob; onSubmit: (values: FormValues) => void }) {
  const toast = useToast();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const takeScreenshot = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToBlob(canvasRef.current, "image/jpeg");
      onSubmit({ screenshot: blob });
    } catch (e) {
      if (e instanceof Error) {
        toast({ description: e.message, status: "error" });
      }
    }
  };

  const previewURL = useObjectURL(file);

  return (
    <Flex gap="2" direction="column">
      {previewURL && (
        <>
          <STLViewer aspectRatio={16 / 10} url={previewURL} ref={canvasRef} />
          <ButtonGroup ml="auto">
            <BackButton />
            <Button onClick={takeScreenshot} colorScheme="primary">
              Take Screenshot
            </Button>
          </ButtonGroup>
        </>
      )}
    </Flex>
  );
}
