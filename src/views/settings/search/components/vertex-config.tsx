import { FormControl, FormHelperText, FormLabel, Input, Select } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import localSettings from "../../../../services/preferences";
import { VertexStatus } from "./vertex-status";

export function VertexConfig() {
  const vertexRelay = useObservableEagerState(localSettings.vertexRelayUrl) || "";
  const vertexMethod = useObservableEagerState(localSettings.vertexSortMethod);

  return (
    <>
      <FormControl>
        <FormLabel>Sort Method</FormLabel>
        <Select value={vertexMethod} onChange={(e) => localSettings.vertexSortMethod.next(e.target.value)} maxW="md">
          <option value="globalPagerank">Global Pagerank</option>
          <option value="userPagerank">User Pagerank</option>
          <option value="followDistance">Follow Distance</option>
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel>Vertex Relay URL</FormLabel>
        <Input
          placeholder="wss://relay.vertex.com"
          value={vertexRelay}
          onChange={(e) => localSettings.vertexRelayUrl.next(e.target.value.trim() || null)}
          maxW="md"
        />
        <FormHelperText>Leave empty to use default</FormHelperText>
      </FormControl>
      <VertexStatus />
    </>
  );
}
