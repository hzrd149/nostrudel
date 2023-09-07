import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ButtonGroup, ButtonGroupProps, IconButton } from "@chakra-ui/react";

import { ImageGridTimelineIcon, TextTimelineIcon, TimelineHealthIcon } from "../icons";
import { TimelineViewType } from "./index";
import { searchParamsToJson } from "../../helpers/url";

export default function TimelineViewTypeButtons(props: ButtonGroupProps) {
  const [params, setParams] = useSearchParams();
  const mode = (params.get("view") as TimelineViewType) ?? "timeline";

  const onChange = useCallback(
    (type: TimelineViewType) => {
      setParams((p) => ({ ...searchParamsToJson(p), view: type }), { replace: true });
    },
    [setParams],
  );

  return (
    <ButtonGroup {...props}>
      <IconButton
        aria-label="Health"
        icon={<TimelineHealthIcon />}
        variant={mode === "health" ? "solid" : "ghost"}
        onClick={() => onChange("health")}
      />
      <IconButton
        aria-label="Timeline"
        icon={<TextTimelineIcon />}
        variant={mode === "timeline" ? "solid" : "outline"}
        onClick={() => onChange("timeline")}
      />
      <IconButton
        aria-label="Image grid"
        icon={<ImageGridTimelineIcon />}
        variant={mode === "images" ? "solid" : "outline"}
        onClick={() => onChange("images")}
      />
    </ButtonGroup>
  );
}
