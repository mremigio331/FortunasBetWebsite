import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetValidLeagues = (enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  const isEnabled = useMemo(
    () =>
      enabled && !!idToken && typeof idToken === "string" && idToken.length > 0,
    [enabled, idToken],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["validLeagues"],
    queryFn: () =>
      apiRequestGet(apiEndpoint, "/room/get_valid_leagues", idToken),
    enabled: isEnabled,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 60, // 1 hour: leagues don't change frequently
    cacheTime: 1000 * 60 * 60 * 2, // 2 hours: cache for a long time
  });

  if (stage === "dev" || stage === "testing") {
    console.log("Valid Leagues Data:", data);
    console.log("Valid Leagues Status:", status);
    console.log("Valid Leagues Error:", error);
    console.log("Valid Leagues isFetching:", isFetching);
    console.log("Valid Leagues isError:", isError);
  }

  return {
    validLeagues: data ? data.data.leagues : [],
    leaguesCount: data ? data.data.count : 0,
    isValidLeaguesFetching: isFetching,
    isValidLeaguesError: isError,
    validLeaguesStatus: status,
    validLeaguesError: error,
    validLeaguesRefetch: refetch,
  };
};

export default useGetValidLeagues;
