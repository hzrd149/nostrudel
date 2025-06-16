import { ButtonGroup, ButtonGroupProps, IconButton } from "@chakra-ui/react";

import { ImageGridTimelineIcon, NoteFeedIcon, TimelineHealthIcon } from "../icons";
import { TimelineViewType } from "./index";
import useRouteSearchValue from "../../hooks/use-route-search-value";

export default function TimelineViewTypeButtons(props: ButtonGroupProps) {
  const viewParam = useRouteSearchValue("view", "timeline");
  const mode = (viewParam.value as TimelineViewType) ?? "timeline";

  return (
    <ButtonGroup {...props}>
      <IconButton
        aria-label="Timeline"
        icon={<NoteFeedIcon boxSize={5} />}
        variant={mode === "timeline" ? "solid" : "outline"}
        onClick={() => viewParam.setValue("timeline")}
      />
      <IconButton
        aria-label="Image grid"
        icon={<ImageGridTimelineIcon boxSize={5} />}
        variant={mode === "images" ? "solid" : "outline"}
        onClick={() => viewParam.setValue("images")}
      />
    </ButtonGroup>
  );
}
