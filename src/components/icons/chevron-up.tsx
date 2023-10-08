import { createIcon } from "@chakra-ui/icons";

const ChevronUp = createIcon({
  displayName: "ChevronUp",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M18 15L12 9L6 15"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronUp;
