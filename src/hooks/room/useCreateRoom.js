import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestPost } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useCreateRoom = () => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();
  const queryClient = useQueryClient();

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData) => {
      if (!idToken || idToken.length === 0) {
        throw new Error("No ID token available.");
      }

      const response = await apiRequestPost({
        apiEndpoint: `${apiEndpoint}/room/create_room`,
        idToken,
        body: roomData,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch rooms list
      queryClient.invalidateQueries({ queryKey: ["allRooms"] });
    },
  });

  return {
    createRoom: createRoomMutation.mutate,
    createRoomAsync: createRoomMutation.mutateAsync,
    createRoomLoading: createRoomMutation.isLoading,
    createRoomError: createRoomMutation.error,
    createRoomStatus: createRoomMutation.status,
    createRoomData: createRoomMutation.data ?? null,
  };
};

export default useCreateRoom;
