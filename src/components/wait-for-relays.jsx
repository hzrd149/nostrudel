import { Spinner } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { getAllActive } from "../services/relays";

export const WaitForRelays = ({ min, children }) => {
  const [hide, setHide] = useState(true);

  useEffect(() => {
    const i = setInterval(async () => {
      if ((await getAllActive()).length > 0) {
        setHide(false);
        clearInterval(i);
      }
    }, 1000);
  }, [setHide]);

  return hide ? <Spinner /> : <>{children}</>;
};
