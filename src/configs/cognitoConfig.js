import {
  PROD_WEBSITE_ENDPOINT,
  TESTING_WEBSITE_ENDPOINT,
} from "../constants/endpoints";

const TESTING_REACT_APP_USER_POOL_ID = "us-west-2_PMZYhDmOM";
const TESTING_REACT_APP_USER_POOL_WEB_CLIENT_ID = "uo12l7quiqh2q5jdsra7pkh97";
const TESTING_REACT_APP_REGION = "us-west-2";
const TESTING_REACT_APP_COGNITO_DOMAIN = "fortunasbet-testing";

const PROD_REACT_APP_USER_POOL_ID = "us-west-2_LGmcTjVkn";
const PROD_REACT_APP_USER_POOL_WEB_CLIENT_ID = "2eee1urhop8n6sv11o9408s9e";
const PROD_REACT_APP_REGION = "us-west-2";
const PROD_REACT_APP_COGNITO_DOMAIN = "fortunasbet-prod";

export const COGNITO_CONSTANTS = {
  DEV: {
    clientId: TESTING_REACT_APP_USER_POOL_WEB_CLIENT_ID,
    domain: TESTING_REACT_APP_COGNITO_DOMAIN,
    redirectUri: "http://localhost:8080/",
    region: TESTING_REACT_APP_REGION,
    userPoolId: TESTING_REACT_APP_USER_POOL_ID,
  },
  TESTING: {
    clientId: TESTING_REACT_APP_USER_POOL_WEB_CLIENT_ID,
    domain: TESTING_REACT_APP_COGNITO_DOMAIN,
    redirectUri: `${TESTING_WEBSITE_ENDPOINT}/`,
    region: TESTING_REACT_APP_REGION,
    userPoolId: TESTING_REACT_APP_USER_POOL_ID,
  },
  PROD: {
    clientId: PROD_REACT_APP_USER_POOL_WEB_CLIENT_ID,
    domain: PROD_REACT_APP_COGNITO_DOMAIN,
    redirectUri: `${PROD_WEBSITE_ENDPOINT}/`,
    region: PROD_REACT_APP_REGION,
    userPoolId: PROD_REACT_APP_USER_POOL_ID,
  },
};
