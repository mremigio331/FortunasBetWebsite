import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetAdminRequests = (enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  const isEnabled = useMemo(
    () =>
      enabled && !!idToken && typeof idToken === "string" && idToken.length > 0,
    [enabled, idToken],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["adminRequests"],
    queryFn: () =>
      apiRequestGet(apiEndpoint, "/membership/get_admin_requests", idToken),
    enabled: isEnabled,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes: admin requests can change frequently
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    adminRequests: data ? data.data.admin_requests : [],
    adminRoomIds: data ? data.data.admin_room_ids : [],
    adminRequestsCount: data ? data.data.count : 0,
    isAdminRequestsFetching: isFetching,
    isAdminRequestsError: isError,
    adminRequestsStatus: status,
    adminRequestsError: error,
    adminRequestsRefetch: refetch,
  };
};

export default useGetAdminRequests;
