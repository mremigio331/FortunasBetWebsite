import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

/**
 * Lazily loads one room's current-week bets via
 * GET /home/rooms/{roomId}/current-bets.
 *
 * Intended to be called per home-page room card (e.g. when its bets panel is
 * opened) so a slow bet lookup for one room never blocks the room list or the
 * other cards. Pass enabled=false to defer the fetch.
 */
const useGetRoomCurrentBets = (roomId, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isEnabled = useMemo(
    () => enabled && !!idToken && !!roomId,
    [enabled, idToken, roomId],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["roomCurrentBets", roomId],
    queryFn: () =>
      apiRequestGet(apiEndpoint, `/home/rooms/${roomId}/current-bets`, idToken),
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
      bets: apiData.bets || {},
      roomSport: apiData.room_sport || null,
      isLoading: isFetching,
      isError,
      status,
      error,
      refetch,
    };
  }, [data, isFetching, isError, status, error, refetch]);
};

export default useGetRoomCurrentBets;
