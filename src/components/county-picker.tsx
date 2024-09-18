import { useMemo } from "react";
import { Select, SelectProps } from "@chakra-ui/react";
import { getAlpha3Codes, getName, registerLocale } from "i18n-iso-countries";

// TODO: support others
import en from "i18n-iso-countries/langs/en.json";
registerLocale(en);

export default function CountyPicker({ ...props }: Omit<SelectProps, "children">) {
  const codes = useMemo(() => Object.keys(getAlpha3Codes()).map((code) => ({ name: getName(code, "en"), code })), []);

  return (
    <Select {...props}>
      <option value="">Any</option>
      {codes.map(({ code, name }) => (
        <option value={code}>{name}</option>
      ))}
    </Select>
  );
}
