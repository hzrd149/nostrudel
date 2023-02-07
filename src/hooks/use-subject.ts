import { useObservable } from "react-use";
import { BehaviorSubject, Subject } from "rxjs";

function useSubject<T>(subject: BehaviorSubject<T>): T;
function useSubject<T>(subject: Subject<T>): T | undefined {
  if (subject instanceof BehaviorSubject) {
    return useObservable(subject, subject.getValue());
  } else return useObservable(subject);
}

export default useSubject;
