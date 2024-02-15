import { useEffect, useState } from "react";
import Subject, { PersistentSubject } from "../classes/subject";

function useSubjects<Value extends unknown>(
  subjects: (Subject<Value> | PersistentSubject<Value> | undefined)[] = [],
): Value[] {
  const values = subjects.map((sub) => sub?.value).filter((v) => v !== undefined) as Value[];
  const [_, update] = useState(0);

  useEffect(() => {
    const listener = () => update((v) => v + 1);
    const subs = subjects.map((s) => s?.subscribe(listener));
    return () => {
      for (const sub of subs) sub?.unsubscribe();
    };
  }, [subjects, update]);

  return values;
}

export default useSubjects;
