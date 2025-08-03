import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetAllMembershipRequests = (enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  const isEnabled = useMemo(
    () =>
      enabled && !!idToken && typeof idToken === "string" && idToken.length > 0,
    [enabled, idToken],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["membershipRequests"],
    queryFn: () =>
      apiRequestGet(
        apiEndpoint,
        "/membership/get_membership_requests",
        idToken,
      ),
    enabled: isEnabled,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes: membership requests can change frequently
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });

  if (stage === "dev" || stage === "testing") {
    console.log("Membership Requests Data:", data);
    console.log("Membership Requests Status:", status);
    console.log("Membership Requests Error:", error);
    console.log("Membership Requests isFetching:", isFetching);
    console.log("Membership Requests isError:", isError);
  }

  return {
    membershipRequests: data ? data.data.membership_requests : [],
    membershipRequestsCount: data ? data.data.count : 0,
    isMembershipRequestsFetching: isFetching,
    isMembershipRequestsError: isError,
    membershipRequestsStatus: status,
    membershipRequestsError: error,
    membershipRequestsRefetch: refetch,
  };
};

export default useGetAllMembershipRequests;
