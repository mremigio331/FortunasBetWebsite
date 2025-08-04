import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetUserMembershipRequests = (enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  const isEnabled = useMemo(
    () =>
      enabled && !!idToken && typeof idToken === "string" && idToken.length > 0,
    [enabled, idToken],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["userMembershipRequests"],
    queryFn: () =>
      apiRequestGet(
        apiEndpoint,
        "/membership/user_membership_requests",
        idToken,
      ),
    enabled: isEnabled,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes: membership requests can change frequently
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });

  // Helper functions to process the membership requests
  const memoizedValues = useMemo(() => {
    const requests = data?.data?.membership_requests || [];

    // Group requests by status for easier access
    const requestsByStatus = {
      pending: requests.filter((req) => req.status === "pending"),
      approved: requests.filter((req) => req.status === "approved"),
      denied: requests.filter((req) => req.status === "denied"),
    };

    // Create a map of room_id to membership status for quick lookup
    const membershipStatusMap = {};
    requests.forEach((req) => {
      // Use the room_id field directly from the API response
      const roomId = req.room_id;

      if (roomId) {
        membershipStatusMap[roomId] = {
          status: req.status,
          request: req,
        };
      }
    });

    return {
      allRequests: requests,
      requestsByStatus,
      membershipStatusMap,
    };
  }, [data]);

  if (stage === "dev" || stage === "testing") {
    console.log("User Membership Requests Data:", data);
    console.log("User Membership Requests Status:", status);
    console.log("User Membership Requests Error:", error);
    console.log("User Membership Requests isFetching:", isFetching);
    console.log("User Membership Requests isError:", isError);
  }

  return {
    userMembershipRequests: memoizedValues.allRequests,
    userMembershipRequestsCount: memoizedValues.allRequests.length,
    membershipRequestsByStatus: memoizedValues.requestsByStatus,
    membershipStatusMap: memoizedValues.membershipStatusMap,
    isUserMembershipRequestsFetching: isFetching,
    isUserMembershipRequestsError: isError,
    userMembershipRequestsStatus: status,
    userMembershipRequestsError: error,
    userMembershipRequestsRefetch: refetch,

    // Helper methods
    getMembershipStatus: (roomId) => {
      return memoizedValues.membershipStatusMap[roomId]?.status || null;
    },
    hasPendingRequest: (roomId) => {
      return memoizedValues.membershipStatusMap[roomId]?.status === "pending";
    },
    isMember: (roomId) => {
      return memoizedValues.membershipStatusMap[roomId]?.status === "approved";
    },
    canRequestMembership: (roomId) => {
      return !memoizedValues.membershipStatusMap[roomId];
    },
  };
};

export default useGetUserMembershipRequests;
