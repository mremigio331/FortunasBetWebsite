import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestPut } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";
import { message } from "antd";

const useChangeMemberStatus = () => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();
  const queryClient = useQueryClient();

  const changeMemberStatusMutation = useMutation({
    mutationFn: async ({
      roomId,
      targetUserId,
      newStatus,
      newMembershipType,
    }) => {
      // Determine which endpoint to use based on the operation
      const statusLower = newStatus.toLowerCase();

      // If it's a simple approve/deny without specific membership type, use edit_membership_request
      if (
        (statusLower === "approved" || statusLower === "denied") &&
        !newMembershipType
      ) {
        const approve = statusLower === "approved";
        const body = {
          room_id: roomId,
          target_user_id: targetUserId,
          approve: approve,
        };

        return apiRequestPut({
          apiEndpoint: `${apiEndpoint}/membership/edit_membership_request`,
          idToken,
          body,
        });
      }
      // For role changes or specific membership types, use change_member_status
      else {
        const body = {
          room_id: roomId,
          target_user_id: targetUserId,
          new_status: statusLower,
          ...(newMembershipType && {
            new_membership_type: newMembershipType.toLowerCase(),
          }),
        };

        return apiRequestPut({
          apiEndpoint: `${apiEndpoint}/membership/change_member_status`,
          idToken,
          body,
        });
      }
    },
    onSuccess: (data, variables) => {
      const { roomId } = variables;

      // Invalidate and refetch room members
      queryClient.invalidateQueries(["room-members", roomId]);

      // Invalidate admin requests in case this affects pending requests
      queryClient.invalidateQueries(["admin-requests"]);

      // Show success message
      const action = data?.data?.action || "Member status updated";
      message.success(`${action} successfully`);

      if (stage === "dev" || stage === "testing") {
        console.log("Change Member Status Success:", data);
      }
    },
    onError: (error, variables) => {
      const errorMessage =
        error?.response?.data?.detail || "Failed to change member status";
      message.error(errorMessage);

      if (stage === "dev" || stage === "testing") {
        console.error("Change Member Status Error:", error);
        console.error("Variables:", variables);
      }
    },
  });

  const changeMemberStatus = async ({
    roomId,
    targetUserId,
    newStatus,
    newMembershipType,
  }) => {
    return changeMemberStatusMutation.mutateAsync({
      roomId,
      targetUserId,
      newStatus,
      newMembershipType,
    });
  };

  return {
    changeMemberStatus,
    isLoading: changeMemberStatusMutation.isLoading,
    error: changeMemberStatusMutation.error,
    isSuccess: changeMemberStatusMutation.isSuccess,
    reset: changeMemberStatusMutation.reset,
  };
};

export default useChangeMemberStatus;
