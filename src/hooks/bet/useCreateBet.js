import { useState, useContext } from "react";
import { message } from "antd";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestPost } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useCreateBet = () => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createBet = async (betData) => {
    setLoading(true);
    setError(null);

    try {
      if (!idToken) {
        throw new Error("Authentication required");
      }

      const response = await apiRequestPost({
        apiEndpoint: `${apiEndpoint}/bet/create`,
        idToken,
        body: betData,
      });

      const responseData = response.data;
      message.success(
        `Successfully placed ${responseData.points_wagered}-point bet!`,
      );
      return responseData;
    } catch (err) {
      console.error("Error creating bet:", err);

      // Handle specific error types from the API
      if (err.response) {
        const { status, data } = err.response;
        switch (status) {
          case 409:
            message.error(
              `You already have a ${data.points_wagered || "duplicate"}-point bet in this room`,
            );
            break;
          case 400:
            if (data.error === "Invalid game status") {
              message.error("Cannot bet on this game - betting is closed");
            } else if (data.error === "Invalid points wagered") {
              message.error("Points wagered must be 1, 2, or 3");
            } else if (data.error === "Invalid bet type") {
              message.error(`Invalid bet: ${data.message}`);
            } else {
              message.error(data.message || "Invalid bet data");
            }
            break;
          case 401:
            message.error("Please log in to place bets");
            break;
          case 500:
            message.error("Server error - please try again later");
            break;
          default:
            message.error("Failed to place bet");
        }
      } else {
        // Network or other errors
        message.error(err.message || "Failed to place bet");
      }

      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createBet,
    isLoading: loading,
    error,
  };
};

export default useCreateBet;
