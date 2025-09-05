import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { useApi } from "../../provider/ApiProvider";

const useAcknowledgeNotification = () => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const mutation = useMutation({
    mutationFn: async (notificationId) => {
      // notificationId can be a string or an object with notification_id
      const id =
        typeof notificationId === "string"
          ? notificationId
          : notificationId.notification_id;
      const response = await fetch(
        `${apiEndpoint}/notifications/acknowledge_notification`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notification_id: id }),
        },
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to acknowledge notification");
      }
      return response.json();
    },
  });

  return {
    acknowledgeNotification: mutation.mutate,
    acknowledgeNotificationAsync: mutation.mutateAsync,
    isAcknowledging: mutation.isLoading,
    isAcknowledgeError: mutation.isError,
    acknowledgeError: mutation.error,
    acknowledgeStatus: mutation.status,
    acknowledgeData: mutation.data,
    resetAcknowledge: mutation.reset,
  };
};

export default useAcknowledgeNotification;
