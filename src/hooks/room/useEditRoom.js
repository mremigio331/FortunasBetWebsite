import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestPut } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useEditRoom = () => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();
  const queryClient = useQueryClient();

  // Edit room mutation
  const editRoomMutation = useMutation({
    mutationFn: async ({ roomId, roomData }) => {
      if (!idToken || idToken.length === 0) {
        throw new Error("No ID token available.");
      }

      const response = await apiRequestPut({
        apiEndpoint: `${apiEndpoint}/room/edit_room`,
        idToken,
        body: { room_id: roomId, ...roomData },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch specific room and rooms list
      queryClient.invalidateQueries({ queryKey: ["room", variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ["allRooms"] });
    },
  });

  return {
    editRoom: editRoomMutation.mutate,
    editRoomAsync: editRoomMutation.mutateAsync,
    editRoomLoading: editRoomMutation.isLoading,
    editRoomError: editRoomMutation.error,
    editRoomStatus: editRoomMutation.status,
    editRoomData: editRoomMutation.data ?? null,
  };
};

export default useEditRoom;
