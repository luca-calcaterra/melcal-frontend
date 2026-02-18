import Keycloak from "keycloak-js";

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;

const keycloak = new Keycloak({
  url: `${KEYCLOAK_URL}`,
  realm: "melcal",
  clientId: "react-frontend",
});

let initPromise = null;

export function initKeycloak(options) {
  if (!initPromise) {
    initPromise = keycloak.init(options);
  }
  return initPromise;
}

export default keycloak;
