import { createIcon } from "@chakra-ui/icons";

const ClockStopwatch = createIcon({
  displayName: "ClockStopwatch",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 9.5V13.5L14.5 15M12 5C7.30558 5 3.5 8.80558 3.5 13.5C3.5 18.1944 7.30558 22 12 22C16.6944 22 20.5 18.1944 20.5 13.5C20.5 8.80558 16.6944 5 12 5ZM12 5V2M10 2H14M20.329 5.59204L18.829 4.09204L19.579 4.84204M3.67102 5.59204L5.17102 4.09204L4.42102 4.84204"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      key="CUiK"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ClockStopwatch;
