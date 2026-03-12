import { createContext, useEffect, useState } from "react";
import keycloak, { initKeycloak } from "./keycloak";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let refreshInterval = null;
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const auth = await initKeycloak({
          onLoad: "login-required",
          pkceMethod: "S256",
          checkLoginIframe: false,
        });

        if (!isMounted) return;

        setAuthenticated(auth);
        setToken(keycloak.token ?? null);

        refreshInterval = setInterval(async () => {
          try {
            const refreshed = await keycloak.updateToken(60);

            if (refreshed && isMounted) {
              setToken(keycloak.token ?? null);
            }
          } catch (error) {
            console.error("Errore durante il refresh del token:", error);

            if (!isMounted) return;

            setToken(null);
            setAuthenticated(false);

            keycloak.login({
              redirectUri: window.location.origin,
            });
          }
        }, 60000);
      } catch (error) {
        console.error("Errore durante l'inizializzazione di Keycloak:", error);

        if (!isMounted) return;

        setToken(null);
        setAuthenticated(false);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;

      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const logout = () => {
    keycloak.logout({
      redirectUri: window.location.origin,
    });
  };

  return (
    <AuthContext.Provider
      value={{ token, authenticated, loading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}