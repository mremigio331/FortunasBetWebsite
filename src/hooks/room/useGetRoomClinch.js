import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

/**
 * Fetches server-computed clinch status for a room:
 * GET /room/{room_id}/clinch
 * Returns per-member best/worst finish, clinched place, winners, and whether
 * the room is complete. Unsupported sports come back with supported=false.
 */
const useGetRoomClinch = (roomId, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isEnabled = useMemo(
    () => enabled && !!idToken && !!roomId,
    [enabled, idToken, roomId],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["roomClinch", roomId],
    queryFn: () =>
      apiRequestGet(apiEndpoint, `/room/${roomId}/clinch`, idToken),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5,
  });

  return useMemo(() => {
    const response = data?.data || {};
    return {
      clinch: response.supported ? response : null,
      isClinchLoading: isLoading,
      refetchClinch: refetch,
    };
  }, [data, isLoading, refetch]);
};

export default useGetRoomClinch;
