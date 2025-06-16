import { createUserListsLoader } from "applesauce-loaders/loaders";
import { cacheRequest } from "./cache-relay";
import { eventStore } from "./event-store";
import pool from "./pool";

const userSetsLoader = createUserListsLoader(pool, { cacheRequest, eventStore });

export default userSetsLoader;
