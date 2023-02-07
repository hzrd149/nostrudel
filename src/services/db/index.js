import { openDB } from "idb";
import { upgrade } from "./migrations";

const version = 1;
const db = await openDB("storage", version, {
  upgrade,
});

export default db;
