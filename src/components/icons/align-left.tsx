import { createIcon } from "@chakra-ui/icons";

const AlignLeft = createIcon({
  displayName: "AlignLeft",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M16 10H3M20 6H3M20 14H3M16 18H3"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default AlignLeft;
