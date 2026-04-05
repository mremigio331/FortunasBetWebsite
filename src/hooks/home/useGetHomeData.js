import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetHomeData = (enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isEnabled = useMemo(() => enabled && !!idToken, [enabled, idToken]);

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["homeData"],
    queryFn: () => {
      return apiRequestGet(apiEndpoint, "/home/get_home_data", idToken);
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
      rooms: apiData.rooms || [],
      roomCount: apiData.room_count || 0,
      isLoading: isFetching,
      isError,
      error,
      refetch,
    };
  }, [data, isFetching, isError, error, refetch]);

  return returnValues;
};

export default useGetHomeData;
