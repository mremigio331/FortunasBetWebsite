// RoomInfoSection.js
// Displays the Room description, information, and admins

import React from "react";
import { Col, Divider, Typography } from "antd";
import RoomInfoCards from "../../../components/room/RoomInfoCards";
import RoomAdmins from "./RoomAdmins";

const { Paragraph } = Typography;

const RoomInfoSection = ({ room }) => (
  <>
    {room.room_description && (
      <Col span={24}>
        <Divider orientation="left">Description</Divider>
        <Paragraph style={{ fontSize: "16px" }}>
          {room.room_description}
        </Paragraph>
      </Col>
    )}
    <Col span={24}>
      <Divider orientation="left">Room Information</Divider>
      <RoomInfoCards room={room} />
    </Col>
    <Col span={24}>
      <RoomAdmins room={room} />
    </Col>
  </>
);

export default RoomInfoSection;
