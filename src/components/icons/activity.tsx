import { createIcon } from "@chakra-ui/icons";

const Activity = createIcon({
  displayName: "Activity",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M22 12H18L15 21L9 3L6 12H2"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default Activity;
