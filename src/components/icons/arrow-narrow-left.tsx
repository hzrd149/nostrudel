import { createIcon } from "@chakra-ui/icons";

const ArrowNarrowLeft = createIcon({
  displayName: "ArrowNarrowLeft",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M20 12H4M4 12L10 18M4 12L10 6"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowNarrowLeft;
