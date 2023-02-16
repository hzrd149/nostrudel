import { useEffect, useState } from "react";
import { PersistentSubject, Subject } from "../classes/subject";

function useSubject<Value extends unknown>(subject: PersistentSubject<Value>): Value;
function useSubject<Value extends unknown>(subject: Subject<Value>): Value | undefined;
function useSubject<Value extends unknown>(subject: Subject<Value>) {
  const [value, setValue] = useState(subject.value);
  useEffect(() => {
    const handler = (value: Value) => setValue(value);
    setValue(subject.value);
    subject.subscribe(handler);

    return () => {
      subject.unsubscribe(handler);
    };
  }, [subject, setValue]);

  return value;
}

export default useSubject;
