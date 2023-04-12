import {
  Flex,
  FormControl,
  FormLabel,
  Switch,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  FormHelperText,
} from "@chakra-ui/react";
import useSubject from "../../hooks/use-subject";
import appSettings, { updateSettings } from "../../services/app-settings";

export default function DisplaySettings() {
  const { blurImages, colorMode } = useSubject(appSettings);

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Display
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction="column" gap="4">
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="use-dark-theme" mb="0">
                Use dark theme
              </FormLabel>
              <Switch
                id="use-dark-theme"
                isChecked={colorMode === "dark"}
                onChange={(v) => updateSettings({ colorMode: v.target.checked ? "dark" : "light" })}
              />
            </Flex>
            <FormHelperText>
              <span>Enabled: hacker mode</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="blur-images" mb="0">
                Blur images from strangers
              </FormLabel>
              <Switch
                id="blur-images"
                isChecked={blurImages}
                onChange={(v) => updateSettings({ blurImages: v.target.checked })}
              />
            </Flex>
            <FormHelperText>
              <span>Enabled: blur images for people you aren't following</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="show-ads" mb="0">
                Show Ads
              </FormLabel>
              <Switch
                id="show-ads"
                isChecked={false}
                onChange={(v) => alert("Sorry, that feature will never be finished.")}
              />
            </Flex>
            <FormHelperText>
              <span>Enabled: shows ads so I can steal your data</span>
            </FormHelperText>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
