import React from "react";
import { createRoot } from "react-dom/client";

import { connectToRelays, subscribeToAuthor, onEvent } from "./services/relays";

const root = createRoot(document.getElementById("root"));
root.render(<h1>Hello, world!</h1>);

await connectToRelays();

const self = "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5";

subscribeToAuthor(self);

onEvent.addListener((event) => {
  console.log(event);
});
