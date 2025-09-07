import React, { useState } from "react";
import { message } from "antd";
import {
  Button,
  Tag,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Switch,
} from "antd";
import {
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
  HourglassOutlined,
} from "@ant-design/icons";
import useCreateMembershipRequest from "../../../hooks/membership/useCreateMembershipRequest";
import useEditRoom from "../../../hooks/room/useEditRoom";

const { Title, Text } = Typography;

const RoomHeader = ({
  room,
  isMember,
  isMembershipFetching,
  currentUserId,
  members,
  isCurrentUserAdmin,
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { editRoomAsync, editRoomLoading } = useEditRoom();

  let membershipTag = null;
  let requestButton = null;

  const { createMembershipRequest, createMembershipRequestLoading } =
    useCreateMembershipRequest();

  // Handler for membership request
  const onRequestMembership = async () => {
    try {
      await createMembershipRequest({ room_id: room.room_id });
      message.success("Membership request sent!");
    } catch (error) {
      message.error("Failed to send membership request. Please try again.");
    }
  };

  if (isMembershipFetching) {
    membershipTag = (
      <Tag icon={<HourglassOutlined />} color="default">
        Checking membership...
      </Tag>
    );
  } else {
    // Find current user in members array
    const userMember = Array.isArray(members)
      ? members.find((m) => m.user_id === currentUserId)
      : null;

    if (userMember && userMember.status === "approved") {
      membershipTag = (
        <Tag icon={<UserOutlined />} color="blue">
          Member
        </Tag>
      );
    } else if (userMember && userMember.status === "pending") {
      membershipTag = (
        <Tag icon={<HourglassOutlined />} color="orange">
          Pending Approval
        </Tag>
      );
    } else {
      requestButton = (
        <Button
          type="primary"
          size="small"
          onClick={onRequestMembership}
          loading={createMembershipRequestLoading}
        >
          Request Membership
        </Button>
      );
    }
  }

  return (
    <div
      style={{
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Title level={2} style={{ margin: 0 }}>
          {room.room_name}
          {isCurrentUserAdmin && (
            <Button
              size="small"
              onClick={() => {
                form.setFieldsValue({
                  room_name: room.room_name,
                  public: room.public,
                });
                setEditModalVisible(true);
              }}
            >
              Edit
            </Button>
          )}
        </Title>
        <Text type="secondary">Room ID: {room.room_id}</Text>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
            alignItems: "center",
          }}
        >
          <Tag
            icon={room.public ? <UnlockOutlined /> : <LockOutlined />}
            color={room.public ? "green" : "red"}
            style={{ fontSize: "14px", padding: "4px 8px" }}
          >
            {room.public ? "Public" : "Private"}
          </Tag>
          {membershipTag}
          {requestButton}
        </div>
      </div>

      <Modal
        title="Edit Room"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            await editRoomAsync({
              roomId: room.room_id,
              roomData: {
                room_name: values.room_name,
                public: values.public,
              },
            });
            setEditModalVisible(false);
          } catch (err) {
            // Validation or mutation error
          }
        }}
        confirmLoading={editRoomLoading}
        okText="Save"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            room_name: room.room_name,
            public: room.public,
          }}
        >
          <Form.Item
            name="room_name"
            label="Room Name"
            rules={[
              { required: true, message: "Please enter a room name" },
              { min: 3, message: "Room name must be at least 3 characters" },
              { max: 50, message: "Room name cannot exceed 50 characters" },
            ]}
          >
            <Input placeholder="Enter room name" />
          </Form.Item>
          <Form.Item
            name="public"
            label="Room is Public"
            valuePropName="checked"
          >
            <Switch checkedChildren="Public" unCheckedChildren="Private" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomHeader;
