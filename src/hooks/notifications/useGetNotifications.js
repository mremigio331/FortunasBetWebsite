import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetNotifications = (enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  const isEnabled = useMemo(
    () =>
      enabled && !!idToken && typeof idToken === "string" && idToken.length > 0,
    [enabled, idToken],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["useGetNotifications"],
    queryFn: () =>
      apiRequestGet(apiEndpoint, "/notifications/get_notifications", idToken),
    enabled: isEnabled,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 10, // 10 minutes: prevents refetch if data is fresh
    cacheTime: 1000 * 60 * 30, // 30 minutes: keeps data in cache
    refetchInterval: 1000 * 60 * 10, // 10 minutes: auto-refetch every 10 minutes
  });

  return {
    notifications: data ? data.data.notifications : [],
    isNotificationsFetching: isFetching,
    isNotificationsError: isError,
    notificationsStatus: status,
    notificationsError: error,
    notificationsRefetch: refetch,
  };
};

export default useGetNotifications;
