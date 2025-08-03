import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestPut } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useEditMembershipRequest = () => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();
  const queryClient = useQueryClient();

  // Edit membership request mutation (approve/deny)
  const editMembershipRequestMutation = useMutation({
    mutationFn: async (requestData) => {
      if (!idToken || idToken.length === 0) {
        throw new Error("No ID token available.");
      }

      const response = await apiRequestPut({
        apiEndpoint: `${apiEndpoint}/membership/edit_membership_request`,
        idToken,
        body: requestData,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch all membership-related queries
      queryClient.invalidateQueries({ queryKey: ["membershipRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminRequests"] });
      // Also invalidate room data as membership changes might affect room info
      queryClient.invalidateQueries({ queryKey: ["room"] });
    },
  });

  return {
    editMembershipRequest: editMembershipRequestMutation.mutate,
    editMembershipRequestAsync: editMembershipRequestMutation.mutateAsync,
    editMembershipRequestLoading: editMembershipRequestMutation.isLoading,
    editMembershipRequestError: editMembershipRequestMutation.error,
    editMembershipRequestStatus: editMembershipRequestMutation.status,
    editMembershipRequestData: editMembershipRequestMutation.data ?? null,
  };
};

export default useEditMembershipRequest;
