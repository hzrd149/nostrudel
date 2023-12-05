import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ButtonGroup, ButtonGroupProps, IconButton } from "@chakra-ui/react";

import { ImageGridTimelineIcon, NoteFeedIcon, TimelineHealthIcon } from "../icons";
import { TimelineViewType } from "./index";

export default function TimelineViewTypeButtons(props: ButtonGroupProps) {
  const [params, setParams] = useSearchParams();
  const mode = (params.get("view") as TimelineViewType) ?? "timeline";

  const onChange = useCallback(
    (type: TimelineViewType) => {
      setParams(
        (p) => {
          const newParams = new URLSearchParams(p);
          newParams.set("view", type);
          return newParams;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return (
    <ButtonGroup {...props}>
      <IconButton
        aria-label="Health"
        icon={<TimelineHealthIcon boxSize={5} />}
        variant={mode === "health" ? "solid" : "ghost"}
        onClick={() => onChange("health")}
      />
      <IconButton
        aria-label="Timeline"
        icon={<NoteFeedIcon boxSize={5} />}
        variant={mode === "timeline" ? "solid" : "outline"}
        onClick={() => onChange("timeline")}
      />
      <IconButton
        aria-label="Image grid"
        icon={<ImageGridTimelineIcon boxSize={5} />}
        variant={mode === "images" ? "solid" : "outline"}
        onClick={() => onChange("images")}
      />
    </ButtonGroup>
  );
}
