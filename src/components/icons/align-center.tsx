import { createIcon } from "@chakra-ui/icons";

const AlignCenter = createIcon({
  displayName: "AlignCenter",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M18 10H6M21 6H3M21 14H3M18 18H6"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default AlignCenter;
