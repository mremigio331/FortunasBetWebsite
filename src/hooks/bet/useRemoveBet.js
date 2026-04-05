import { useState, useContext } from "react";
import { message } from "antd";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestDelete } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useRemoveBet = () => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const removeBet = async ({ room_id, game_id, sport, league }) => {
    setLoading(true);
    setError(null);

    try {
      if (!idToken) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams({ room_id, game_id, sport, league });
      const response = await apiRequestDelete({
        apiEndpoint: `${apiEndpoint}/bet/remove?${params.toString()}`,
        idToken,
      });

      message.success("Bet removed successfully");
      return response.data;
    } catch (err) {
      console.error("Error removing bet:", err);

      if (err.response) {
        const { status, data } = err.response;
        switch (status) {
          case 401:
            message.error("Please log in to remove bets");
            break;
          case 403:
            message.error("You don't have permission to remove this bet");
            break;
          case 404:
            message.error("Bet not found");
            break;
          case 409:
            message.error("Game has already started — bet is locked");
            break;
          default:
            message.error(data.error || "Failed to remove bet");
        }
      } else {
        message.error(err.message || "Failed to remove bet");
      }

      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    removeBet,
    isLoading: loading,
    error,
  };
};

export default useRemoveBet;
