import { useColorMode } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import useAppSettings from "./use-app-settings";

export default function useSetColorMode() {
  const { setColorMode } = useColorMode();
  const { colorMode } = useAppSettings();
  const [params] = useSearchParams();

  useEffect(() => {
    setColorMode(params.get("colorMode") || colorMode);
  }, [colorMode, params.get("colorMode")]);
}
