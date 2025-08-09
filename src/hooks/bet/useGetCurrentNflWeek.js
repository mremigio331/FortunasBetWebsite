import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetCurrentNflWeek = (enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  const isEnabled = useMemo(() => enabled && !!idToken, [enabled, idToken]);

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["currentNflWeek"],
    queryFn: () => {
      return apiRequestGet(apiEndpoint, "/bet/get_current_nfl_week", idToken);
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });

  const returnValues = useMemo(() => {
    const apiData = data?.data?.data || data?.data || {};
    return {
      currentWeekInfo: apiData,
      isFetching,
      isError,
      status,
      error,
      refetch,
    };
  }, [data, isFetching, isError, status, error, refetch]);

  return returnValues;
};

export default useGetCurrentNflWeek;
