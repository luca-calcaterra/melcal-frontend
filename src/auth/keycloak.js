import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080/",
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
