import { createIcon } from "@chakra-ui/icons";

const PauseCircle = createIcon({
  displayName: "PauseCircle",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M9.5 15V9M14.5 15V9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default PauseCircle;
