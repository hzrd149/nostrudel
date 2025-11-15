import { Card, FormControl, FormHelperText, FormLabel, Input } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import { DEFAULT_PRIMAL_CACHE_URL } from "../../../../const";
import localSettings from "../../../../services/preferences";

export function PrimalConfig() {
  const primalCache = useObservableEagerState(localSettings.primalCacheUrl) || "";

  return (
    <>
      <FormControl>
        <FormLabel>Primal Cache Server URL</FormLabel>
        <Input
          placeholder={DEFAULT_PRIMAL_CACHE_URL}
          value={primalCache}
          onChange={(e) => localSettings.primalCacheUrl.next(e.target.value.trim() || null)}
          maxW="md"
        />
        <FormHelperText>Leave empty to use default</FormHelperText>
      </FormControl>
    </>
  );
}
