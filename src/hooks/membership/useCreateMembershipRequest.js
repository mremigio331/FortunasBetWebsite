import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestPost } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useCreateMembershipRequest = () => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();
  const queryClient = useQueryClient();

  // Create membership request mutation
  const createMembershipRequestMutation = useMutation({
    mutationFn: async (requestData) => {
      if (!idToken || idToken.length === 0) {
        throw new Error("No ID token available.");
      }

      const response = await apiRequestPost({
        apiEndpoint: `${apiEndpoint}/membership/create_membership_request`,
        idToken,
        body: requestData,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch membership requests
      queryClient.invalidateQueries({ queryKey: ["membershipRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminRequests"] });
    },
  });

  return {
    createMembershipRequest: createMembershipRequestMutation.mutate,
    createMembershipRequestAsync: createMembershipRequestMutation.mutateAsync,
    createMembershipRequestLoading: createMembershipRequestMutation.isLoading,
    createMembershipRequestError: createMembershipRequestMutation.error,
    createMembershipRequestStatus: createMembershipRequestMutation.status,
    createMembershipRequestData: createMembershipRequestMutation.data ?? null,
  };
};

export default useCreateMembershipRequest;
