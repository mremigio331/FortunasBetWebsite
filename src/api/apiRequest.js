import axios from "axios";
import { commitHash as gitCommitHash } from "../constants/gitHash";

const getHeaders = (idToken) => {
  const headers = {
    "Content-Type": "application/json",
    ...(idToken && { Authorization: `Bearer ${idToken}` }),
  };

  if (gitCommitHash) {
    headers["X-Git-Commit"] = gitCommitHash;
  } else {
    console.warn(
      "X-Git-Commit header not added because the commit hash is empty.",
    );
  }

  return headers;
};

export const apiRequestGet = (apiEndpoint, route, idToken) => {
  return axios.get(encodeURI(`${apiEndpoint}${route}`), {
    headers: getHeaders(idToken),
  });
};

export const apiRequestPost = ({ apiEndpoint, idToken, body }) => {
  return axios.post(apiEndpoint, body, {
    withCredentials: true,
    headers: getHeaders(idToken),
  });
};

export const apiRequestPut = ({ apiEndpoint, idToken, body }) => {
  return axios.put(apiEndpoint, body, {
    withCredentials: true,
    headers: getHeaders(idToken),
  });
};

export const apiRequestDelete = ({ apiEndpoint, idToken }) => {
  return axios.delete(apiEndpoint, {
    withCredentials: true,
    headers: getHeaders(idToken),
  });
};
