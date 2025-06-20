import {
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
} from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { useId } from "react";

import SimpleView from "../../../components/layout/presets/simple-view";
import { useAppTitle } from "../../../hooks/use-app-title";
import localSettings from "../../../services/local-settings";

function SocialGraphSlider({
  value,
  label,
  helper,
  onChange,
}: {
  value: number | null;
  label: string;
  helper: string;
  onChange: (value: number | null) => void;
}) {
  const id = useId();
  const labels = ["Just you", "Friends", "Friends of Friends", "3rd degree", "4th degree", "5th degree", "Everyone"];

  return (
    <FormControl pb="6">
      <FormLabel htmlFor={id}>
        {label}:{" "}
        <Text size="sm" as="span" fontWeight="bold">
          {labels[value ?? 6]}
        </Text>
      </FormLabel>
      <FormHelperText>{helper}</FormHelperText>
      <Slider
        id={id}
        value={value ?? 6}
        onChange={(v) => onChange(v === 6 ? null : v)}
        min={0}
        max={6}
        step={1}
        mt="2"
        maxW="lg"
      >
        {labels.map((_, index) => (
          <SliderMark
            key={index}
            value={index}
            mt="2"
            fontSize="sm"
            color="gray.500"
            textAlign="center"
            whiteSpace="nowrap"
          >
            {index}
          </SliderMark>
        ))}
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </FormControl>
  );
}

export default function ContentPoliciesSettings() {
  useAppTitle("Content Policies");

  const hideEventsOutsideSocialGraph = useObservableEagerState(localSettings.hideEventsOutsideSocialGraph);
  const blurMediaOutsideSocialGraph = useObservableEagerState(localSettings.blurMediaOutsideSocialGraph);
  const hideEmbedsOutsideSocialGraph = useObservableEagerState(localSettings.hideEmbedsOutsideSocialGraph);

  return (
    <SimpleView title="Content Policies" maxW="container.xl" gap="4">
      <Heading size="md">Events</Heading>

      <SocialGraphSlider
        label="Show events from"
        value={hideEventsOutsideSocialGraph}
        onChange={(value) => localSettings.hideEventsOutsideSocialGraph.next(value)}
        helper="Show events from users who are in your social graph"
      />

      <Heading size="md">Media</Heading>

      <SocialGraphSlider
        label="Show media from"
        value={blurMediaOutsideSocialGraph}
        onChange={(value) => localSettings.blurMediaOutsideSocialGraph.next(value)}
        helper="Show media from users who are in your social graph"
      />

      <Heading size="md">Embeds</Heading>

      <SocialGraphSlider
        label="Show embeds from"
        value={hideEmbedsOutsideSocialGraph}
        onChange={(value) => localSettings.hideEmbedsOutsideSocialGraph.next(value)}
        helper="Show embeds from users who are in your social graph"
      />
    </SimpleView>
  );
}
