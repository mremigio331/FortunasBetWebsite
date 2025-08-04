import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetBetsForRoom = (roomId, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  // Validate required parameters
  const hasRequiredParams = useMemo(
    () => roomId !== undefined && roomId !== null && roomId !== "",
    [roomId],
  );

  const isEnabled = useMemo(
    () => enabled && hasRequiredParams && !!idToken,
    [enabled, hasRequiredParams, idToken],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["roomBets", roomId],
    queryFn: () => {
      return apiRequestGet(apiEndpoint, `/bet/room/${roomId}/bets`, idToken);
    },
    enabled: isEnabled,
    keepPreviousData: false, // Get fresh data when room changes
    staleTime: 1000 * 60 * 2, // 2 minutes - shorter for more real-time updates
    cacheTime: 1000 * 60 * 10, // 10 minutes cache
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when window comes back into focus
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes for live updates
  });

  // Memoize the return values
  const returnValues = useMemo(() => {
    // Handle the nested data structure from apiRequestGet
    const apiData = data?.data?.data || data?.data || {};
    const bets = apiData.bets || [];
    const users = apiData.users || {}; // User profiles keyed by user_id
    const betsCount = apiData.count || 0;
    const hasBets = bets.length > 0;

    return {
      bets,
      users, // Include users data
      betsCount,
      roomId: apiData.room_id || roomId,
      message: apiData.message || data?.message || null,
      isBetsFetching: isFetching,
      isBetsError: isError,
      betsStatus: status,
      betsError: error,
      betsRefetch: refetch,
      // Helper methods
      refetchBets: () => refetch(),
      // Check if we have bets data
      hasBets,
      // Get bets by user
      getBetsByUser: (userId) => {
        return bets.filter((bet) => bet.user_id === userId);
      },
      // Get current user's bets
      getCurrentUserBets: (currentUserId) => {
        if (!currentUserId) return [];
        return bets.filter((bet) => bet.user_id === currentUserId);
      },
      // Get other users' bets
      getOtherUsersBets: (currentUserId) => {
        if (!currentUserId) return [];
        return bets.filter((bet) => bet.user_id !== currentUserId);
      },
      // Get bets by points wagered
      getBetsByPoints: (points) => {
        return bets.filter((bet) => bet.points_wagered === points);
      },
    };
  }, [data, roomId, isFetching, isError, status, error, refetch, isEnabled]);

  return returnValues;
};

export default useGetBetsForRoom;
