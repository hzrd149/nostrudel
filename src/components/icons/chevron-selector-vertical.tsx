import { createIcon } from "@chakra-ui/icons";

const ChevronSelectorVertical = createIcon({
  displayName: "ChevronSelectorVertical",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M7 15L12 20L17 15M7 9L12 4L17 9"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronSelectorVertical;
