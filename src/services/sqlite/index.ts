import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from "@capacitor-community/sqlite";
import { CAP_IS_WEB } from "../../env";

const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);

// Setup hacky web sqlite
if (CAP_IS_WEB) {
  throw new Error("Do not load the sqlite module on web, it does not work because jeep-sqlite can not be disabled");
  const { JeepSqlite } = await import("jeep-sqlite/dist/components/jeep-sqlite");
  customElements.define("jeep-sqlite", JeepSqlite);

  const jeepEl = document.createElement("jeep-sqlite");
  document.body.appendChild(jeepEl);
  await customElements.whenDefined("jeep-sqlite");
  await sqlite.initWebStore();
}

export async function openConnection(
  dbName: string,
  encrypted: boolean,
  mode: string,
  version: number,
  isDelete: boolean,
): Promise<SQLiteDBConnection> {
  let db: SQLiteDBConnection;
  try {
    const retCC = (await sqlite.checkConnectionsConsistency()).result;
    let isConn = (await sqlite.isConnection(dbName, false)).result;
    if (retCC && isConn) {
      db = await sqlite.retrieveConnection(dbName, false);
    } else {
      db = await sqlite.createConnection(dbName, encrypted, mode, version, false);
    }
    if (isDelete) {
      await deleteDatabase(db);
    }
    await db.open();
    return db;
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function deleteDatabase(db: SQLiteDBConnection): Promise<void> {
  try {
    const ret = (await db.isExists()).result;
    if (ret) {
      const dbName = db.getConnectionDBName();
      await db.delete();
      return Promise.resolve();
    } else {
      return Promise.resolve();
    }
  } catch (err) {
    return Promise.reject(err);
  }
}
