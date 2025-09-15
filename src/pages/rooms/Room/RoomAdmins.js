import React from "react";
import { Divider, Tag, Space } from "antd";

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
                {admin.user_name.length > 10
                  ? `${admin.user_name.slice(0, 10)}...`
                  : admin.user_name}
              </Tag>
            ))
          : (room.admin_user_ids || room.admins).map((adminId, index) => (
              <Tag key={adminId} color="blue">
                Admin {index + 1}:{" "}
                {adminId.length > 10 ? `${adminId.slice(0, 10)}...` : adminId}
              </Tag>
            ))}
      </Space>
    </>
  );
};

export default RoomAdmins;
