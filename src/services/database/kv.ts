import db from ".";

async function getItem<T extends unknown>(key: string) {
  return db.get("kv", key) as Promise<T | undefined>;
}

async function setItem<T extends unknown>(key: string, value: T) {
  return db.put("kv", value, key);
}

async function deleteItem(key: string) {
  return db.delete("kv", key);
}

const idbKeyValueStore = {
  getItem,
  setItem,
  deleteItem,
};

export default idbKeyValueStore;
