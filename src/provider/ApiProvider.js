import React, { createContext, useReducer, useMemo, useContext } from "react";
import getStage from "../utility/getStage";
import {
  PROD_API_ENDPOINT,
  STAGING_API_ENDPOINT,
} from "../constants/endpoints";

const endpointMap = {
  prod: PROD_API_ENDPOINT,
  staging: STAGING_API_ENDPOINT,
  dev: "http://localhost:5000",
};

const ApiContext = createContext();

const apiReducer = (state, action) => {
  switch (action.type) {
    case "SET_ENDPOINT":
      return { ...state, apiEndpoint: action.payload };
    default:
      return state;
  }
};

export const ApiProvider = ({ children }) => {
  const stage = getStage();
  const initialEndpoint = endpointMap[stage.toLocaleLowerCase()];

  const [state, dispatch] = useReducer(apiReducer, {
    apiEndpoint: initialEndpoint,
    stage,
  });

  // Only allow changing endpoint in dev
  const setApiEndpoint = (newEndpoint) => {
    if (state.stage === "dev") {
      dispatch({ type: "SET_ENDPOINT", payload: newEndpoint });
    }
  };

  // Memoize setApiEndpoint so it doesn't change on every render
  const stableSetApiEndpoint = useMemo(() => setApiEndpoint, [state.stage]);

  const value = useMemo(
    () => ({
      apiEndpoint: state.apiEndpoint,
      stage: state.stage,
      setApiEndpoint: state.stage === "dev" ? stableSetApiEndpoint : undefined,
    }),
    [state.apiEndpoint, state.stage, stableSetApiEndpoint],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = () => useContext(ApiContext);

export default ApiProvider;
