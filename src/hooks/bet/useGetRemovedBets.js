import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetRemovedBets = (roomId, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isEnabled = useMemo(
    () => enabled && !!roomId && !!idToken,
    [enabled, roomId, idToken],
  );

  const { data, isFetching, isError, error, refetch, isLoading } = useQuery({
    queryKey: ["removedBets", roomId],
    queryFn: async () => {
      const endpoint = `/bet/room/${roomId}/removed_bets`;
      const result = await apiRequestGet(apiEndpoint, endpoint, idToken);
      const outerData = result?.data || {};
      const innerData = outerData?.data || {};
      return {
        removedBets: innerData.removed_bets || [],
        count: innerData.count || 0,
        room_id: innerData.room_id || roomId,
      };
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 10,
    retry: 2,
  });

  return useMemo(() => {
    const removedBets = data?.removedBets || [];
    return {
      removedBets,
      removedBetsCount: removedBets.length,
      isRemovedBetsFetching: isFetching,
      isRemovedBetsLoading: isLoading,
      isRemovedBetsError: isError,
      removedBetsError: error,
      refetchRemovedBets: refetch,
    };
  }, [data, isFetching, isLoading, isError, error, refetch]);
};

export default useGetRemovedBets;
