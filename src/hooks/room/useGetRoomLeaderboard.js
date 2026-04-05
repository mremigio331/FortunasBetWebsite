import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetRoomLeaderboard = (roomId, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isEnabled = useMemo(
    () => enabled && !!idToken && !!roomId,
    [enabled, idToken, roomId],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["roomLeaderboard", roomId],
    queryFn: () =>
      apiRequestGet(apiEndpoint, `/room/${roomId}/leaderboard`, idToken),
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
    return {
      leaderboard: response.leaderboard || [],
      leaderboardCount: response.count || 0,
      isLeaderboardLoading: isLoading,
      isLeaderboardFetching: isFetching,
      isLeaderboardError: isError,
      leaderboardError: error,
      refetchLeaderboard: refetch,
    };
  }, [data, isLoading, isFetching, isError, error, refetch]);
};

export default useGetRoomLeaderboard;
