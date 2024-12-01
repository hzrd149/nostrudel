type Datum = object;
type Obj = object;

declare function dataJoint(
  data: Datum[],
  existingObjs: Obj[],
  appendObj: (obj: Obj) => void,
  removeObj: (obj: Obj) => void,
  options: {
    createObj?(d: Datum): Obj,
    updateObj?(obj: Obj, d: Datum): void,
    exitObj?(obj: Obj): void,
    objBindAttr?: string,
    dataBindAttr?: string,
    idAccessor?: string | ((Datum) => string | number) | null,
    purge?: boolean;
  }
): void;

export default dataJoint;
