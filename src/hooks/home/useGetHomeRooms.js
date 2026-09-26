import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

/**
 * Fast home-page room list via GET /home/rooms.
 *
 * Returns just the user's approved active rooms (id, name, sport, status) so the
 * home page can render room cards immediately. Each card then loads its own
 * current-week bets lazily with useGetRoomCurrentBets.
 */
const useGetHomeRooms = (enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isEnabled = useMemo(() => enabled && !!idToken, [enabled, idToken]);

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["homeRooms"],
    queryFn: () => apiRequestGet(apiEndpoint, "/home/rooms", idToken),
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
      rooms: apiData.rooms || [],
      roomCount: apiData.room_count || 0,
      isLoading: isFetching,
      isError,
      status,
      error,
      refetch,
    };
  }, [data, isFetching, isError, status, error, refetch]);
};

export default useGetHomeRooms;
