import { Navigate } from "react-router-dom";

export default function ToolsHomeView() {
  return <Navigate replace to="/other-stuff?tab=tools" />;
}
