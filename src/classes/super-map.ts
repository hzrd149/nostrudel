export default class SuperMap<Key, Value> extends Map<Key, Value> {
  newValue: (key: Key) => Value;

  constructor(newValue: (key: Key) => Value) {
    super();
    this.newValue = newValue;
  }

  get(key: Key) {
    let value = super.get(key);
    if (value === undefined) {
      value = this.newValue(key);
      this.set(key, value);
    }
    return value;
  }
}
