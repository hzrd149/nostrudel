import { createIcon } from "@chakra-ui/icons";

const ChevronSelectorHorizontal = createIcon({
  displayName: "ChevronSelectorHorizontal",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M9 7L4 12L9 17M15 7L20 12L15 17"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronSelectorHorizontal;
