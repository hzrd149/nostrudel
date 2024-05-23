import { useState } from "react";
import { Button } from "@chakra-ui/react";

export default function FormatButton({
  getValue,
  setValue,
}: {
  getValue: () => string;
  setValue: (str: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const format = async () => {
    setLoading(true);
    const prettier = await import("prettier");
    const markdownPlugin = (await import("prettier/plugins/markdown")).default;

    setValue(await prettier.format(getValue(), { parser: "markdown", printWidth: 120, plugins: [markdownPlugin] }));
    setLoading(false);
  };

  return (
    <Button onClick={format} colorScheme="primary" isLoading={loading}>
      Format
    </Button>
  );
}
