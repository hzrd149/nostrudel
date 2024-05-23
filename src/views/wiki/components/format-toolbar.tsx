import { useState } from "react";
import { Button, Flex, Spinner } from "@chakra-ui/react";

export default function FormatToolbar({
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
    <Flex gap="2">
      <Button onClick={format} size="sm" colorScheme="primary" isDisabled={loading}>
        Format
      </Button>

      {loading && <Spinner />}
    </Flex>
  );
}
