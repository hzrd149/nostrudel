import { useEffect, useState } from "react";
import { PersistentSubject, Subject } from "../classes/subject";

function useSubject<Value extends unknown>(subject: PersistentSubject<Value>): Value;
function useSubject<Value extends unknown>(subject?: PersistentSubject<Value>): Value | undefined;
function useSubject<Value extends unknown>(subject?: Subject<Value>): Value | undefined;
function useSubject<Value extends unknown>(subject?: Subject<Value>) {
  const [_, setValue] = useState(subject?.value);
  useEffect(() => {
    subject?.subscribe(setValue, undefined, false);
    return () => {
      subject?.unsubscribe(setValue, undefined);
    };
  }, [subject, setValue]);

  return subject?.value;
}

export default useSubject;
