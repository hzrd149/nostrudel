import { Navigate } from "react-router";

export default function ToolsHomeView() {
  return <Navigate replace to="/other-stuff?tab=tools" />;
}
