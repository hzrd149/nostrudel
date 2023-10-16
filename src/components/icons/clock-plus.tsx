import { createIcon } from "@chakra-ui/icons";

const ClockPlus = createIcon({
  displayName: "ClockPlus",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M21.9208 13.265C21.9731 12.8507 22 12.4285 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C12.4354 22 12.8643 21.9722 13.285 21.9182M12 6V12L15.7384 13.8692M19 22V16M16 19H22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ClockPlus;
