import { css } from "@emotion/react";

export const capacitorScannerStyles = css`
  #cap-os-barcode-scanner-container {
    .scanner-dialog-inner {
      padding: 0;
      position: relative;

      .close-button {
        top: 0.2rem;
        right: 0.2rem;
        position: absolute;
        z-index: 100;
        width: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 2rem;
        font-size: 3rem;
      }

      p {
        display: none;
      }
    }
  }
`;
