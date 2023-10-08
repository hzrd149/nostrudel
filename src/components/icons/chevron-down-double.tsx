import { createIcon } from "@chakra-ui/icons";

const ChevronDownDouble = createIcon({
  displayName: "ChevronDownDouble",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M7 13L12 18L17 13M7 6L12 11L17 6"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronDownDouble;
