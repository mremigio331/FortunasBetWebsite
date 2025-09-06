import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetAllRooms = (enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  const isEnabled = useMemo(() => {
    const enabled_check =
      enabled && !!idToken && typeof idToken === "string" && idToken.length > 0;
    return enabled_check;
  }, [enabled, idToken]);

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["allRooms"],
    queryFn: () => apiRequestGet(apiEndpoint, "/room/get_all_rooms", idToken),
    enabled: isEnabled,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes: rooms don't change frequently
    cacheTime: 1000 * 60 * 15, // 15 minutes: keeps data in cache
  });

  return {
    allRooms: data ? data.data.rooms : [],
    roomsCount: data ? data.data.count : 0,
    isRoomsFetching: isFetching,
    isRoomsError: isError,
    roomsStatus: status,
    roomsError: error,
    roomsRefetch: refetch,
  };
};

export default useGetAllRooms;
