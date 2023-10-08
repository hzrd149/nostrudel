import { createIcon } from "@chakra-ui/icons";

const FlipForward = createIcon({
  displayName: "FlipForward",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M21 9H7.5C5.01472 9 3 11.0147 3 13.5C3 15.9853 5.01472 18 7.5 18H12M21 9L17 5M21 9L17 13"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default FlipForward;
