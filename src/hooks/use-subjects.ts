import { useEffect, useState } from "react";
import { PersistentSubject, Subject } from "../classes/subject";

function useSubjects<Value extends unknown>(
  subjects: (Subject<Value> | PersistentSubject<Value> | undefined)[] = [],
): Value[] {
  const values = subjects.map((sub) => sub?.value).filter((v) => v !== undefined) as Value[];
  const [_, update] = useState(0);

  useEffect(() => {
    const listener = () => update((v) => v + 1);
    for (const sub of subjects) {
      sub?.subscribe(listener, undefined, false);
    }
    return () => {
      for (const sub of subjects) {
        sub?.unsubscribe(listener, undefined);
      }
    };
  }, [subjects, update]);

  return values;
}

export default useSubjects;
