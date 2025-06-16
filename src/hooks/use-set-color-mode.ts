import { useColorMode } from "@chakra-ui/react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useAppSettings from "./use-user-app-settings";

export default function useSetColorMode() {
  const { setColorMode } = useColorMode();
  const { colorMode } = useAppSettings();
  const [params] = useSearchParams();

  useEffect(() => {
    setColorMode(params.get("colorMode") || colorMode);
  }, [colorMode, params.get("colorMode")]);
}
