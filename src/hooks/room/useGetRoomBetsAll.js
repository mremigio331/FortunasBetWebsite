import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetRoomBetsAll = (roomId, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isEnabled = useMemo(
    () => enabled && !!idToken && !!roomId,
    [enabled, idToken, roomId],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["roomBetsAll", roomId],
    queryFn: () =>
      apiRequestGet(apiEndpoint, `/room/${roomId}/bets/all`, idToken),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 10,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5,
  });

  return useMemo(() => {
    const response = data?.data || {};
    const innerData = response.data || {};
    const bets = innerData.bets || [];
    const rawUsers = innerData.users || {};

    // Normalize user profiles to match expected shape (user_name, user_color)
    const users = {};
    for (const [userId, profile] of Object.entries(rawUsers)) {
      users[userId] = {
        ...profile,
        user_name: profile.name || userId,
        user_color: profile.color || "black",
      };
    }

    return {
      bets,
      users,
      betsCount: innerData.count || 0,
      isBetsLoading: isLoading,
      isBetsFetching: isFetching,
      isBetsError: isError,
      betsError: error,
      refetchBets: refetch,
      hasBets: bets.length > 0,
    };
  }, [data, isLoading, isFetching, isError, error, refetch]);
};

export default useGetRoomBetsAll;
