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
  Select,
  Textarea,
} from "@chakra-ui/react";
import { AppSettings } from "../../services/settings/migrations";
import { AppearanceIcon } from "../../components/icons";

export default function DisplaySettings() {
  const { register } = useFormContext<AppSettings>();

  return (
    <AccordionItem>
      <h2>
        <AccordionButton fontSize="xl">
          <AppearanceIcon mr="2" />
          <Box as="span" flex="1" textAlign="left">
            Display
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction="column" gap="4">
          <FormControl>
            <FormLabel htmlFor="theme" mb="0">
              Theme
            </FormLabel>
            <Select id="theme" {...register("theme")}>
              <option value="default">Default</option>
              <option value="chakraui">ChakraUI</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="colorMode" mb="0">
              Color Mode
            </FormLabel>
            <Select id="colorMode" {...register("colorMode")}>
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
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
            <FormLabel htmlFor="maxPageWidth" mb="0">
              Max Page width
            </FormLabel>
            <Select id="maxPageWidth" {...register("maxPageWidth")}>
              <option value="none">None</option>
              <option value="md">Medium (~768px)</option>
              <option value="lg">Large (~992px)</option>
              <option value="xl">Extra Large (~1280px)</option>
            </Select>
            <FormHelperText>
              <span>Setting this will restrict the width of app on desktop</span>
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
          <FormControl>
            <FormLabel htmlFor="muted-words" mb="0">
              Muted words
            </FormLabel>
            <Textarea id="muted-words" {...register("mutedWords")} placeholder="Broccoli, Spinach, Artichoke..." />
            <FormHelperText>
              <span>
                Comma separated list of words, phrases or hashtags you never want to see in notes. (case insensitive)
              </span>
              <br />
              <span>Be careful its easy to hide all notes if you add common words.</span>
            </FormHelperText>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
