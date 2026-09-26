import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

/**
 * Fast standings header via GET /room/{roomId}/standings/members.
 *
 * Returns the room's active members with profiles (no bets), so the standings
 * table can render its rows immediately. Each row then loads that user's bets
 * lazily with useGetUserRoomBets.
 */
const useGetStandingsMembers = (roomId, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isEnabled = useMemo(
    () => enabled && !!idToken && !!roomId,
    [enabled, idToken, roomId],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["standingsMembers", roomId],
    queryFn: () =>
      apiRequestGet(apiEndpoint, `/room/${roomId}/standings/members`, idToken),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });

  return useMemo(() => {
    const apiData = data?.data || {};
    return {
      members: apiData.members || [],
      memberCount: apiData.count || 0,
      isLoading: isFetching,
      isError,
      status,
      error,
      refetch,
    };
  }, [data, isFetching, isError, status, error, refetch]);
};

export default useGetStandingsMembers;
