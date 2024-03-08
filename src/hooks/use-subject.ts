import { useEffect, useRef, useState } from "react";
import Subject, { PersistentSubject } from "../classes/subject";

function useSubject<Value extends unknown>(subject: PersistentSubject<Value>): Value;
function useSubject<Value extends unknown>(subject?: PersistentSubject<Value>): Value | undefined;
function useSubject<Value extends unknown>(subject?: Subject<Value>): Value | undefined;
function useSubject<Value extends unknown>(subject?: Subject<Value>) {
  const [_, setValue] = useState(subject?.value);
  const subRef = useRef(subject);
  useEffect(() => {
    if (subject?.value !== undefined) setValue(subject?.value);
    const sub = subject?.subscribe((v) => setValue(v));
    return () => sub?.unsubscribe();
  }, [subject, setValue]);

  return subject?.value;
}

export default useSubject;
