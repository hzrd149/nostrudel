import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HomeView } from "./views/home";
import { UserView } from "./views/user";
import { ErrorBoundary } from "./components/error-boundary";
import { Page } from "./components/page";
import { SettingsView } from "./views/settings";
import { GlobalView } from "./views/global";
import { SetupView } from "./views/setup";
import useSubject from "./hooks/use-subject";
import identity from "./services/identity";

const RequireSetup = ({ children }: { children: JSX.Element }) => {
  let location = useLocation();
  const setup = useSubject(identity.setup);

  if (!setup)
    return <Navigate to="/setup" state={{ from: location.pathname }} replace />;

  return children;
};

export const App = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/setup" element={<SetupView />} />
        <Route
          path="/user/:pubkey"
          element={
            <RequireSetup>
              <Page>
                <UserView />
              </Page>
            </RequireSetup>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireSetup>
              <Page>
                <SettingsView />
              </Page>
            </RequireSetup>
          }
        />
        <Route
          path="/global"
          element={
            <RequireSetup>
              <Page>
                <GlobalView />
              </Page>
            </RequireSetup>
          }
        />
        <Route
          path="/"
          element={
            <RequireSetup>
              <Page>
                <HomeView />
              </Page>
            </RequireSetup>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
};
