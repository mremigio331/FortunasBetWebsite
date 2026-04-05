import { useState, useContext } from "react";
import { message } from "antd";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestPut } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useUpdateBet = () => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateBet = async (betData) => {
    setLoading(true);
    setError(null);

    try {
      if (!idToken) {
        throw new Error("Authentication required");
      }

      const response = await apiRequestPut({
        apiEndpoint: `${apiEndpoint}/bet/update`,
        idToken,
        body: betData,
      });

      const responseData = response.data;
      message.success(
        `Successfully updated to ${responseData.points_wagered}-point bet!`,
      );
      return responseData;
    } catch (err) {
      console.error("Error updating bet:", err);

      if (err.response) {
        const { status, data } = err.response;
        switch (status) {
          case 400:
            message.error(data.error || data.message || "Invalid bet data");
            break;
          case 401:
            message.error("Please log in to update bets");
            break;
          case 403:
            message.error("You don't have permission to update this bet");
            break;
          case 404:
            message.error("Bet not found");
            break;
          case 409:
            message.error("Game has already started — bet is locked");
            break;
          default:
            message.error(data.error || "Failed to update bet");
        }
      } else {
        message.error(err.message || "Failed to update bet");
      }

      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateBet,
    isLoading: loading,
    error,
  };
};

export default useUpdateBet;
