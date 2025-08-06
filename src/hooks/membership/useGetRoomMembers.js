import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetRoomMembers = (roomId, enabled = true) => {
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
    queryKey: ["room-members", roomId],
    queryFn: () =>
      apiRequestGet(
        apiEndpoint,
        `/membership/get_room_members/${roomId}`,
        idToken,
      ),
    enabled: isEnabled,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    members: data?.data?.members || [],
    memberCount: data?.data?.count || 0,
    isMembersFetching: isFetching,
    isMembersError: isError,
    membersStatus: status,
    membersError: error,
    membersRefetch: refetch,
  };
};

export default useGetRoomMembers;
