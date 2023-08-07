import { ButtonGroup, ButtonGroupProps, IconButton } from "@chakra-ui/react";
import { ImageGridTimelineIcon, TextTimelineIcon } from "../icons";
import { TimelineViewType } from "./index";
import { useSearchParams } from "react-router-dom";

export default function TimelineViewTypeButtons(props: ButtonGroupProps) {
  const [params, setParams] = useSearchParams();
  const mode = (params.get("view") as TimelineViewType) ?? "timeline";

  const onChange = (type: TimelineViewType) => {
    setParams({ view: type }, { replace: true });
  };

  return (
    <ButtonGroup>
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
