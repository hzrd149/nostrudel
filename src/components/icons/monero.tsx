import { createIcon } from "@chakra-ui/icons";

const Monero = createIcon({
  displayName: "Monero",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 0C5.376 0 0 5.376 0 12c0 1.32.213 2.589.606 3.789h3.585V6.544L12 14.353l7.809-7.809v9.245h3.585c.393-1.2.606-2.469.606-3.789 0-6.624-5.376-12-12-12zm-1.788 15.953L7.809 13.55v5.279H2.531C4.69 22.149 8.085 24 12 24s7.31-1.851 9.469-5.171h-5.278V13.55l-2.403 2.403L12 17.741l-1.788-1.788z"
      fill="currentColor"
      key="monero"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default Monero;
