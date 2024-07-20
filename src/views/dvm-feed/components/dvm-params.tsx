import { AddressPointer } from "nostr-tools/nip19";
import useDVMMetadata from "../../../hooks/use-dvm-metadata";
import { Select } from "@chakra-ui/react";

export default function DVMParams({
  pointer,
  params,
  onChange,
}: {
  pointer: AddressPointer;
  params: Record<string, string>;
  onChange: (params: Record<string, string>) => void;
}) {
  const metadata = useDVMMetadata(pointer);

  const paramsWithOptions = Object.entries(metadata?.nip90Params || {}).filter(
    ([param, obj]) => obj.values && obj.values.length > 0,
  );

  return (
    <>
      {paramsWithOptions.map(([param, args]) => (
        <Select
          key={param}
          isRequired={!!args.required}
          w="10rem"
          onChange={(e) => onChange({ ...params, [param]: e.target.value })}
        >
          {args.values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      ))}
    </>
  );
}
