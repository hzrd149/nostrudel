import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Select,
  useColorMode,
  useColorModePreference,
} from "@chakra-ui/react";
import SimpleView from "../../../../components/layout/presets/simple-view";

export default function DisplaySettingsView() {
  const colorPreference = useColorModePreference();
  const { colorMode, setColorMode } = useColorMode();

  return (
    <SimpleView title="Display Settings">
      <FormControl maxW="sm">
        <Flex justifyContent="space-between">
          <FormLabel htmlFor="colorMode" mb="0">
            Color Mode
          </FormLabel>
          {colorPreference && colorMode !== colorPreference && (
            <Button
              variant="link"
              colorScheme="brand"
              fontWeight="normal"
              fontSize="sm"
              ml="auto"
              onClick={() => setColorMode(colorPreference)}
            >
              Use system default
            </Button>
          )}
        </Flex>
        <Select id="colorMode" maxW="sm" value={colorMode} onChange={(e) => setColorMode(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>

        <FormHelperText></FormHelperText>
      </FormControl>
    </SimpleView>
  );
}
