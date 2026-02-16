import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "https://keycloak-app--0000002.ambitioussky-de3f00f7.eastus.azurecontainerapps.io/",
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
