import debug from "debug";

if (!localStorage.getItem("debug") && import.meta.env.DEV)
  debug.enable("noStrudel,noStrudel:*,applesauce,applesauce:*");

export const logger = debug("noStrudel");
