import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useContext } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";
import { getSeasonTypeDisplayName } from "../../configs/nflSeasonTypes";

const useGetNFLWeeksInRange = (startDate, endDate, options = {}) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  // Convert dates to epoch if they're Date objects or strings
  const startEpoch = useMemo(() => {
    if (!startDate) return null;
    if (typeof startDate === "number") return startDate;
    if (startDate instanceof Date)
      return Math.floor(startDate.getTime() / 1000);
    if (typeof startDate === "string")
      return Math.floor(new Date(startDate).getTime() / 1000);
    return null;
  }, [startDate]);

  const endEpoch = useMemo(() => {
    if (!endDate) return null;
    if (typeof endDate === "number") return endDate;
    if (endDate instanceof Date) return Math.floor(endDate.getTime() / 1000);
    if (typeof endDate === "string")
      return Math.floor(new Date(endDate).getTime() / 1000);
    return null;
  }, [endDate]);

  // Only fetch if both dates are valid
  const shouldFetch = useMemo(() => {
    return startEpoch && endEpoch && startEpoch < endEpoch;
  }, [startEpoch, endEpoch]);

  // Build query parameters
  const queryParams = useMemo(() => {
    if (!shouldFetch) return "";
    const params = new URLSearchParams();
    params.append("start_date", startEpoch.toString());
    params.append("end_date", endEpoch.toString());
    return params.toString();
  }, [shouldFetch, startEpoch, endEpoch]);

  const {
    data: nflWeeksData,
    isLoading: isNFLWeeksFetching,
    isError: isNFLWeeksError,
    error: nflWeeksError,
    refetch: nflWeeksRefetch,
    ...rest
  } = useQuery({
    queryKey: ["nflWeeksInRange", startEpoch, endEpoch],
    queryFn: async () => {
      if (!shouldFetch) {
        throw new Error("Invalid date range");
      }


      const response = await apiRequestGet(
        apiEndpoint,
        `/odds/get_nfl_weeks_in_range?${queryParams}`,
        idToken,
      );

      return response.data;
    },
    enabled: Boolean(shouldFetch && idToken),
    staleTime: 1000 * 60 * 30, // 30 minutes - NFL schedule doesn't change often
    cacheTime: 1000 * 60 * 60, // 1 hour
    retry: (failureCount, error) => {
      // Retry up to 3 times with exponential backoff
      if (failureCount >= 3) return false;
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false; // Don't retry client errors
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });

  // Derived data for easier consumption
  const availableSeasons = useMemo(() => {
    if (!nflWeeksData?.seasons_summary) return [];

    return nflWeeksData.seasons_summary.map((season) => ({
      year: season.year,
      seasonType: season.season_type,
      seasonName: season.season_name,
      availableWeeks: season.weeks,
      displayName: `${season.year} ${getSeasonTypeDisplayName(season.season_type)}`,
    }));
  }, [nflWeeksData]);

  // Get unique years available
  const availableYears = useMemo(() => {
    if (!availableSeasons.length) return [];

    const years = [...new Set(availableSeasons.map((season) => season.year))];
    return years.sort((a, b) => b - a); // Sort descending (newest first)
  }, [availableSeasons]);

  // Get available season types for a specific year
  const getSeasonTypesForYear = useMemo(() => {
    return (year) => {
      if (!availableSeasons.length || !year) return [];

      return availableSeasons
        .filter((season) => season.year === year)
        .map((season) => ({
          seasonType: season.seasonType,
          seasonName: season.seasonName,
          displayName: getSeasonTypeDisplayName(season.seasonType),
          availableWeeks: season.availableWeeks,
        }));
    };
  }, [availableSeasons]);

  // Get available weeks for a specific year and season type
  const getWeeksForYearAndSeason = useMemo(() => {
    return (year, seasonType) => {
      if (!availableSeasons.length || !year || !seasonType) return [];

      const season = availableSeasons.find(
        (s) => s.year === year && s.seasonType === seasonType,
      );

      return season ? season.availableWeeks : [];
    };
  }, [availableSeasons]);

  // Check if a specific combination is valid
  const isValidCombination = useMemo(() => {
    return (year, seasonType, week) => {
      const availableWeeks = getWeeksForYearAndSeason(year, seasonType);
      return availableWeeks.includes(week);
    };
  }, [getWeeksForYearAndSeason]);

  // Get the first available option (for default selection)
  const getDefaultSelection = useMemo(() => {
    return () => {
      if (!availableSeasons.length) return null;

      // Sort by year (descending) then by season type (regular season first)
      const sortedSeasons = [...availableSeasons].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        // Prefer regular season (type 2) over preseason (type 1) or playoffs (type 3)
        if (a.seasonType === 2 && b.seasonType !== 2) return -1;
        if (b.seasonType === 2 && a.seasonType !== 2) return 1;
        return a.seasonType - b.seasonType;
      });

      const firstSeason = sortedSeasons[0];
      if (!firstSeason) return null;

      return {
        year: firstSeason.year,
        seasonType: firstSeason.seasonType,
        week: firstSeason.availableWeeks[0] || 1,
      };
    };
  }, [availableSeasons]);

  return {
    // Raw data
    nflWeeks: nflWeeksData?.weeks || [],
    nflWeeksData,

    // Loading states
    isNFLWeeksFetching,
    isNFLWeeksError,
    nflWeeksError,

    // Actions
    nflWeeksRefetch,

    // Derived data
    availableSeasons,
    availableYears,
    totalWeeksFound: nflWeeksData?.total_weeks_found || 0,
    dateRange: {
      startDate: nflWeeksData?.start_date_iso,
      endDate: nflWeeksData?.end_date_iso,
    },

    // Helper functions
    getSeasonTypesForYear,
    getWeeksForYearAndSeason,
    isValidCombination,
    getDefaultSelection,

    // Computed flags
    hasWeeks: Boolean(availableSeasons.length > 0),
    hasValidDateRange: shouldFetch,

    ...rest,
  };
};

export default useGetNFLWeeksInRange;
