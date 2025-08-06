import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetUserMembershipStatus = (roomId, enabled = true) => {
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
    queryKey: ["user-membership-status", roomId],
    queryFn: async () => {
      // Get all user's membership requests and find the one for this room
      const response = await apiRequestGet(
        apiEndpoint,
        "/membership/user_membership_requests",
        idToken,
      );

      // Find membership for this specific room
      const membershipRequests = response.data?.membership_requests || [];
      const roomMembership = membershipRequests.find(
        (membership) => membership.room_id === roomId,
      );

      return {
        membership: roomMembership || null,
        status: roomMembership?.status || "none",
        membershipType: roomMembership?.membership_type || null,
        isApproved: roomMembership?.status?.toLowerCase() === "approved",
        isPending: roomMembership?.status?.toLowerCase() === "pending",
        isDenied: roomMembership?.status?.toLowerCase() === "denied",
        isMember: roomMembership?.status?.toLowerCase() === "approved",
      };
    },
    enabled: isEnabled,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });
  return {
    membershipData: data?.membership || null,
    membershipStatus: data?.status || "none",
    membershipType: data?.membershipType || null,
    isApproved: data?.isApproved || false,
    isPending: data?.isPending || false,
    isDenied: data?.isDenied || false,
    isMember: data?.isMember || false,
    isMembershipFetching: isFetching,
    isMembershipError: isError,
    membershipError: error,
    membershipRefetch: refetch,
  };
};

export default useGetUserMembershipStatus;
