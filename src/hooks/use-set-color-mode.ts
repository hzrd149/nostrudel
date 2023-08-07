import { useColorMode } from "@chakra-ui/react";
import useSubject from "./use-subject";
import appSettings from "../services/settings/app-settings";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function useSetColorMode() {
  const { setColorMode } = useColorMode();
  const { colorMode } = useSubject(appSettings);
  const [params] = useSearchParams();

  useEffect(() => {
    setColorMode(params.get("colorMode") || colorMode);
  }, [colorMode, params.get("colorMode")]);
}
