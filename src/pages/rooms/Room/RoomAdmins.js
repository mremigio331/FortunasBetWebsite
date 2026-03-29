import React from "react";
import { Divider, Tag, Space } from "antd";
import { truncateName } from "../../../utils/textUtils";

const RoomAdmins = ({ room }) => {
  if (!room.admin_user_ids && !room.admins && !room.admin_profiles) return null;
  if (
    (room.admin_user_ids || room.admins || []).length === 0 &&
    (!room.admin_profiles || room.admin_profiles.length === 0)
  )
    return null;

  return (
    <>
      <Divider orientation="left">Room Admins</Divider>
      <Space wrap>
        {room.admin_profiles
          ? room.admin_profiles.map((admin, index) => (
              <Tag key={admin.user_id} color="blue">
                {truncateName(admin.user_name, 10)}
              </Tag>
            ))
          : (room.admin_user_ids || room.admins).map((adminId, index) => (
              <Tag key={adminId} color="blue">
                Admin {index + 1}: {truncateName(adminId, 10)}
              </Tag>
            ))}
      </Space>
    </>
  );
};

export default RoomAdmins;
