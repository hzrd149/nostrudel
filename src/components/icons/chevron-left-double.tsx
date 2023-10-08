import { createIcon } from "@chakra-ui/icons";

const ChevronLeftDouble = createIcon({
  displayName: "ChevronLeftDouble",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M18 17L13 12L18 7M11 17L6 12L11 7"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronLeftDouble;
