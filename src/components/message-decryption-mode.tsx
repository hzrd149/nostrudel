import { Box, Flex, Radio, RadioGroup, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useId } from "react";

import useAsyncAction from "../hooks/use-async-action";
import localSettings from "../services/preferences";

export default function MessageDecryptionMode() {
  const auto = use$(localSettings.autoDecryptMessages);
  const labelId = useId();
  const changeMode = useAsyncAction(async (value: string) => {
    await localSettings.autoDecryptMessages.next(value === "automatic");
  });

  return (
    <Flex direction="column" gap="2">
      <Text fontWeight="medium" id={labelId}>
        Message decryption
      </Text>
      <RadioGroup
        aria-labelledby={labelId}
        value={auto ? "automatic" : "manual"}
        onChange={changeMode.run}
        isDisabled={changeMode.loading}
      >
        <Flex gap="3" direction={{ base: "column", sm: "row" }}>
          <Box borderWidth="1px" borderColor={!auto ? "primary.500" : undefined} borderRadius="md" flex="1">
            <Radio value="manual" colorScheme="primary" w="full" p="4">
              <Text fontWeight="medium">Manual</Text>
              <Text>Decrypt messages when you choose.</Text>
            </Radio>
          </Box>
          <Box borderWidth="1px" borderColor={auto ? "primary.500" : undefined} borderRadius="md" flex="1">
            <Radio value="automatic" colorScheme="primary" w="full" p="4">
              <Text fontWeight="medium">Automatic</Text>
              <Text>Decrypt messages as they arrive.</Text>
            </Radio>
          </Box>
        </Flex>
      </RadioGroup>
    </Flex>
  );
}
