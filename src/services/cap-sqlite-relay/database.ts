import { databaseMigrations } from "./migrations";
import sqliteService from "./sqlite";

const databaseName = "noStrudel";
const databaseVersion = 1;

await sqliteService.addUpgradeStatement({ database: databaseName, upgrade: databaseMigrations });
const database = await sqliteService.openDatabase(databaseName, databaseVersion, false);

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.database = database;
}

export default database;
