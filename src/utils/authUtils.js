import { jwtDecode } from "jwt-decode";

/**
 * Decode a JWT token and return the user ID (sub claim).
 * Returns null if the token is missing or invalid.
 * @param {string|null} idToken - The JWT token to decode
 * @returns {string|null} The user ID or null
 */
export const getUserIdFromToken = (idToken) => {
  if (!idToken) return null;
  try {
    return jwtDecode(idToken).sub;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};
