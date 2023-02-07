import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Providers } from "./providers";

const root = createRoot(document.getElementById("root"));
root.render(
  <Providers>
    <App />
  </Providers>
);
