import { createContext } from "react";

const FocusedContext = createContext({ id: "", focus: (id: string) => {} });

export default FocusedContext;
