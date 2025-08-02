import axios from "axios";

export const apiRequestGet = (apiEndpoint, route, idToken) => {
  return axios.get(encodeURI(`${apiEndpoint}${route}`), {
    // Remove withCredentials for GET to avoid preflight CORS issues
    headers: {
      "Content-Type": "application/json",
      ...(idToken && { Authorization: `Bearer ${idToken}` }),
    },
  });
};

export const apiRequestPost = ({ apiEndpoint, idToken, body }) => {
  return axios.post(apiEndpoint, body, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      ...(idToken && { Authorization: `Bearer ${idToken}` }),
    },
  });
};

export const apiRequestPut = ({ apiEndpoint, idToken, body }) => {
  return axios.put(apiEndpoint, body, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      ...(idToken && { Authorization: `Bearer ${idToken}` }),
    },
  });
};

export const apiRequestDelete = ({ apiEndpoint, idToken }) => {
  return axios.delete(apiEndpoint, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      ...(idToken && { Authorization: `Bearer ${idToken}` }),
    },
  });
};
