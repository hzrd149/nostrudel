import { useFormContext } from "react-hook-form";
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
  Input,
} from "@chakra-ui/react";
import { AppSettings } from "../../services/user-app-settings";

export default function DisplaySettings() {
  const { register } = useFormContext<AppSettings>();

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
              <FormLabel htmlFor="colorMode" mb="0">
                Use dark theme
              </FormLabel>
              <Switch id="colorMode" {...register("colorMode")} />
            </Flex>
            <FormHelperText>
              <span>Enables hacker mode</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="primaryColor" mb="0">
                Primary Color
              </FormLabel>
              <Input id="primaryColor" type="color" maxW="120" size="sm" {...register("primaryColor")} />
            </Flex>
            <FormHelperText>
              <span>The primary color of the theme</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="blurImages" mb="0">
                Blur images from strangers
              </FormLabel>
              <Switch id="blurImages" {...register("blurImages")} />
            </Flex>
            <FormHelperText>
              <span>Enabled: blur images for people you aren't following</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="show-content-warning" mb="0">
                Show content warning
              </FormLabel>
              <Switch id="show-content-warning" {...register("showContentWarning")} />
            </Flex>
            <FormHelperText>
              <span>Enabled: shows a warning for notes with NIP-36 Content Warning</span>
            </FormHelperText>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
