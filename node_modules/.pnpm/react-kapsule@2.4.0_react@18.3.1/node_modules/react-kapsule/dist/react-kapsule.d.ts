import * as React from 'react';

type PropGetter = () => any;
type PropSetter = (val: any) => KapsuleInstance;
type CompMethod = (...args: any[]) => any;

interface KapsuleInstance {
  (element: HTMLElement): KapsuleInstance;
  [propOrMethod: string]: PropGetter | PropSetter | CompMethod | any;
}
type Kapsule = (initOptions?: object) => KapsuleInstance;

interface FromKapsuleOptions {
  wrapperElementType?: string | React.Component;
  nodeMapper?: (node: HTMLElement) => any;
  methodNames?: string[];
  initPropNames?: string[];
}

declare function fromKapsule<Props ={}, Methods = {}>(
  kapsule: Kapsule,
  options?: FromKapsuleOptions
): React.FunctionComponent<Props & { ref?: React.MutableRefObject<Methods | undefined> }>;

export { fromKapsule as default };
