import React from "react";
import { Card, Row } from "antd";
import RoomHeader from "../RoomHeader";
import RoomInfoSection from "../RoomInfoSection";
import MembershipManagement from "../MembershipManagement";

/**
 * Info tab: room details header, info section, and (for admins) membership
 * management.
 */
const InfoTab = ({
  room,
  isMember,
  isMembershipFetching,
  currentUserId,
  members,
  isCurrentUserAdmin,
  roomId,
  idToken,
}) => (
  <>
    <Card>
      <div style={{ marginBottom: 16 }}>
        <RoomHeader
          room={room}
          isMember={isMember}
          isMembershipFetching={isMembershipFetching}
          currentUserId={currentUserId}
          members={members}
          isCurrentUserAdmin={isCurrentUserAdmin}
          variant="details"
        />
      </div>
      <Row gutter={[24, 24]}>
        <RoomInfoSection room={room} />
      </Row>
    </Card>
    {isCurrentUserAdmin && (
      <div style={{ marginTop: 24 }}>
        <MembershipManagement roomId={roomId} idToken={idToken} />
      </div>
    )}
  </>
);

export default InfoTab;
