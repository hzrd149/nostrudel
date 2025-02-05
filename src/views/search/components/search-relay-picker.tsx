import { forwardRef } from "react";
import { Select, SelectProps } from "@chakra-ui/react";

import useSearchRelays, { useCacheRelaySupportsSearch } from "../../../hooks/use-search-relays";

const SearchRelayPicker = forwardRef<
  any,
  Omit<SelectProps, "children" | "value"> & { value?: string; showLocal?: boolean }
>(({ value, onChange, showLocal, ...props }, ref) => {
  const searchRelays = useSearchRelays();
  const localSearchSupported = useCacheRelaySupportsSearch();

  return (
    <Select ref={ref} w="auto" value={value} onChange={onChange} {...props}>
      {showLocal && localSearchSupported && <option value="">Local Relay</option>}
      {searchRelays.map((url) => (
        <option key={url} value={url}>
          {url}
        </option>
      ))}
    </Select>
  );
});
export default SearchRelayPicker;
