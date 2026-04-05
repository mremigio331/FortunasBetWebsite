import { useQuery } from "@tanstack/react-query";
import { useMemo, useContext } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetMLBWeeksInRange = (startDate, endDate, options = {}) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

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

  const shouldFetch = useMemo(() => {
    return startEpoch && endEpoch && startEpoch < endEpoch;
  }, [startEpoch, endEpoch]);

  const queryParams = useMemo(() => {
    if (!shouldFetch) return "";
    const params = new URLSearchParams();
    params.append("start_date", startEpoch.toString());
    params.append("end_date", endEpoch.toString());
    return params.toString();
  }, [shouldFetch, startEpoch, endEpoch]);

  const {
    data: mlbWeeksData,
    isLoading: isMLBWeeksFetching,
    isError: isMLBWeeksError,
    error: mlbWeeksError,
    refetch: mlbWeeksRefetch,
    ...rest
  } = useQuery({
    queryKey: ["mlbWeeksInRange", startEpoch, endEpoch],
    queryFn: async () => {
      if (!shouldFetch) {
        throw new Error("Invalid date range");
      }

      const response = await apiRequestGet(
        apiEndpoint,
        `/odds/get_mlb_weeks_in_range?${queryParams}`,
        idToken,
      );

      return response.data;
    },
    enabled: Boolean(shouldFetch && idToken),
    staleTime: 1000 * 60 * 30, // 30 minutes - MLB week schedule is static
    cacheTime: 1000 * 60 * 60, // 1 hour
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });

  // MLB weeks are a flat list (Mon-Sun), derive helpers for easy consumption
  const availableWeeks = useMemo(() => {
    if (!mlbWeeksData?.weeks) return [];
    return mlbWeeksData.weeks.map((week) => ({
      week: week.week,
      start: week.start,
      end: week.end,
      label: week.label,
      startDate: week.start_date,
      endDate: week.end_date,
    }));
  }, [mlbWeeksData]);

  const getWeekByNumber = useMemo(() => {
    return (weekNumber) => {
      return availableWeeks.find((w) => w.week === weekNumber) || null;
    };
  }, [availableWeeks]);

  const getDefaultSelection = useMemo(() => {
    return () => {
      if (!availableWeeks.length) return null;

      // Find the current week based on current time, or default to first
      const now = Math.floor(Date.now() / 1000);
      const currentWeek = availableWeeks.find(
        (w) => now >= w.start && now <= w.end,
      );

      return currentWeek || availableWeeks[0];
    };
  }, [availableWeeks]);

  return {
    // Raw data
    mlbWeeks: mlbWeeksData?.weeks || [],
    mlbWeeksData,

    // Loading states
    isMLBWeeksFetching,
    isMLBWeeksError,
    mlbWeeksError,

    // Actions
    mlbWeeksRefetch,

    // Derived data
    availableWeeks,
    totalWeeksFound: mlbWeeksData?.total_weeks_found || 0,
    dateRange: {
      startDate: mlbWeeksData?.start_date_iso,
      endDate: mlbWeeksData?.end_date_iso,
    },

    // Helper functions
    getWeekByNumber,
    getDefaultSelection,

    // Computed flags
    hasWeeks: Boolean(availableWeeks.length > 0),
    hasValidDateRange: shouldFetch,

    ...rest,
  };
};

export default useGetMLBWeeksInRange;
