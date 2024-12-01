type InitOptions = object;

type PropVal = any;
type StateVal = any;

interface State {
  initialised: boolean;
  _rerender: () => void;
  [stateItem: string]: StateVal;
}

interface PropCfg {
  default?: PropVal;
  onChange?(newVal: PropVal, state: State, prevVal: PropVal): void;
  triggerUpdate?: boolean;
}

type MethodCfg = (state: State, ...args: any[]) => any;

interface KapsuleCfg {
  props?: { [prop: string]: PropCfg };
  methods?: { [method: string]: MethodCfg };
  aliases?: { [propOrMethod: string]: string };
  stateInit?: (initOptions?: InitOptions) => Partial<State>;
  init?: (
    contructorItem?: any,
    state?: State,
    initOptions?: InitOptions
  ) => void;
  update: (state?: State, changedProps?: { [prop: string]: PropVal }) => void;
}

type PropGetter = () => PropVal;
type PropSetter = (val: PropVal) => KapsuleInstance;
type KapsuleMethod = (...args: any[]) => any;

interface KapsuleInstance {
  (constructorItem: any): KapsuleInstance;
  resetProps(): KapsuleInstance;
  [propOrMethod: string]: PropGetter | PropSetter | KapsuleMethod;
}

type KapsuleClosure = (initOptions?: InitOptions) => KapsuleInstance;

declare function Kapsule(cfg?: KapsuleCfg): KapsuleClosure;

export { type KapsuleCfg, type KapsuleClosure, type KapsuleInstance, Kapsule as default };
