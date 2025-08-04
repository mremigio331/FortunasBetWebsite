import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetNFLOdds = (week, year, seasonType = 2, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  // Validate required parameters
  const hasRequiredParams = useMemo(
    () =>
      week !== undefined &&
      week !== null &&
      year !== undefined &&
      year !== null,
    [week, year],
  );

  const isEnabled = useMemo(
    () => enabled && hasRequiredParams,
    [enabled, hasRequiredParams],
  );

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (week !== undefined && week !== null)
      params.append("week", week.toString());
    if (year !== undefined && year !== null)
      params.append("year", year.toString());
    if (seasonType !== undefined && seasonType !== null)
      params.append("season_type", seasonType.toString());
    return params.toString();
  }, [week, year, seasonType]);

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["nflOdds", week, year, seasonType],
    queryFn: () => {
      console.log(
        `Fetching NFL odds for: Week ${week}, Year ${year}, Season Type ${seasonType}`,
      );
      return apiRequestGet(
        apiEndpoint,
        `/odds/get_nfl_odds?${queryParams}`,
        idToken,
      );
    },
    enabled: isEnabled,
    keepPreviousData: false, // Changed to false to immediately show loading state
    staleTime: 1000 * 60 * 5, // Reduced to 5 minutes for more responsive updates
    cacheTime: 1000 * 60 * 15, // Reduced cache time for fresh data
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when window comes back into focus
  });

  if (stage === "dev" || stage === "testing") {
    console.log("NFL Odds Data:", data);
    console.log("NFL Odds Status:", status);
    console.log("NFL Odds Error:", error);
    console.log("NFL Odds isFetching:", isFetching);
    console.log("NFL Odds isError:", isError);
    console.log("NFL Odds Query Params:", queryParams);
  }

  return {
    nflOdds: data ? data.data.odds : [],
    oddsCount: data ? data.data.count : 0,
    week: data ? data.data.week : week,
    year: data ? data.data.year : year,
    seasonType: data ? data.data.season_type : seasonType,
    sport: data ? data.data.sport : null,
    league: data ? data.data.league : null,
    message: data ? data.data.message : null,
    isOddsFetching: isFetching,
    isOddsError: isError,
    oddsStatus: status,
    oddsError: error,
    oddsRefetch: refetch,
    // Helper methods
    refetchOdds: () => refetch(),
    // Check if we have odds data
    hasOdds: data ? data.data.odds.length > 0 : false,
  };
};

export default useGetNFLOdds;
