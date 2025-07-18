import {
  Box,
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
import { useId, useMemo } from "react";

import SimpleView from "../../../components/layout/presets/simple-view";
import { humanReadableSats } from "../../../helpers/lightning";
import { useAppTitle } from "../../../hooks/use-app-title";
import localSettings from "../../../services/preferences";
import { socialGraph$ } from "../../../services/social-graph";

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
  const graph = useObservableEagerState(socialGraph$);

  const count = useMemo(() => {
    if (value === null) return null;

    let total = 0;
    for (let i = 0; i <= value; i++) {
      total += graph.getUsersByFollowDistance(i).size;
    }
    return total;
  }, [value]);

  return (
    <FormControl pb="6">
      <FormLabel htmlFor={id}>
        {label}:{" "}
        <Text size="sm" as="span" fontWeight="bold">
          {count !== null ? `${labels[value ?? 6]} (${humanReadableSats(count)})` : labels[value ?? 6]}
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
      <Box>
        <Heading size="md">Events</Heading>
        <Text fontStyle="italic" color="GrayText">
          This setting will limit all content you see to your social graph. If your social graph is small or you want to
          see a global view set this to{" "}
          <Text as="span" fontWeight="bold">
            Everyone
          </Text>
          .
        </Text>
      </Box>

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
