import { createIcon } from "@chakra-ui/icons";

const ChevronUpDouble = createIcon({
  displayName: "ChevronUpDouble",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M17 18L12 13L7 18M17 11L12 6L7 11"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronUpDouble;
