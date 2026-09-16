import { createContext } from "react";

const FocusedContext = createContext({ id: "", focus: (_id: string) => {} });

export default FocusedContext;
