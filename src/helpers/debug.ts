import debug from "debug";

if (!localStorage.getItem("debug") && import.meta.env.DEV) debug.enable("noStrudel,noStrudel:*");

export const logger = debug("noStrudel");
