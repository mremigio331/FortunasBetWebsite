import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

/**
 * One user's bets for a room via GET /room/{roomId}/bets/user/{userId}.
 *
 * Loaded per standings row so a slow lookup for one user never blocks the
 * others (they run in parallel). The backend uses the display read path — no
 * live ESPN enhancement — so this is cheap. Pass enabled=false to defer (e.g.
 * lazy on row expand).
 */
const useGetUserRoomBets = (roomId, userId, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isEnabled = useMemo(
    () => enabled && !!idToken && !!roomId && !!userId,
    [enabled, idToken, roomId, userId],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["userRoomBets", roomId, userId],
    queryFn: () =>
      apiRequestGet(
        apiEndpoint,
        `/room/${roomId}/bets/user/${userId}`,
        idToken,
      ),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 10,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });

  return useMemo(() => {
    const apiData = data?.data || {};
    return {
      bets: apiData.bets || [],
      betCount: apiData.count || 0,
      userId: apiData.user_id || userId,
      isLoading: isFetching,
      isError,
      status,
      error,
      refetch,
    };
  }, [data, isFetching, isError, status, error, userId, refetch]);
};

export default useGetUserRoomBets;
