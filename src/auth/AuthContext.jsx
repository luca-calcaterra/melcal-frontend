import { createContext, useEffect, useState } from "react";
import keycloak, { initKeycloak } from "./keycloak";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    initKeycloak({
        onLoad: "check-sso",
        pkceMethod: "S256",
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
      })
      .then((auth) => {
        if (!auth) {
          keycloak.login();
        } else {
          setToken(keycloak.token);
          setAuthenticated(true);
        }
      });

    const interval = setInterval(() => {
      keycloak.updateToken(60).then((refreshed) => {
        if (refreshed) {
          setToken(keycloak.token);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    keycloak.logout({
      redirectUri: window.location.origin,
    });
  };

  return (
    <AuthContext.Provider value={{ token, authenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
