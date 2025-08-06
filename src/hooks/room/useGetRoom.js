import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetRoom = (roomId, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  const isEnabled = useMemo(
    () =>
      enabled &&
      !!idToken &&
      typeof idToken === "string" &&
      idToken.length > 0 &&
      !!roomId,
    [enabled, idToken, roomId],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () =>
      apiRequestGet(apiEndpoint, `/room/get_room/${roomId}`, idToken),
    enabled: isEnabled,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
  });

  return {
    room: data ? data.data.room : null,
    isRoomFetching: isFetching,
    isRoomError: isError,
    roomStatus: status,
    roomError: error,
    roomRefetch: refetch,
  };
};

export default useGetRoom;
