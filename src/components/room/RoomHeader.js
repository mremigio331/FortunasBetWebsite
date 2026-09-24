import React, { useState } from "react";
import { message } from "antd";
import {
  Button,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Switch,
  Select,
} from "antd";
import {
  LockOutlined,
  UnlockOutlined,
  HourglassOutlined,
} from "@ant-design/icons";
import useCreateMembershipRequest from "../../hooks/membership/useCreateMembershipRequest";
import useEditRoom from "../../hooks/room/useEditRoom";
import MembershipStatusTag from "../shared/MembershipStatusTag";
import SportTag from "../shared/SportTag";

const { Title, Text } = Typography;

/**
 * RoomHeader renders the room identity in two parts that can be placed
 * independently:
 *   - variant="name" (default): just the room name + admin Edit control. Meant
 *     to live at the very top of the page, above the section tabs.
 *   - variant="details": the metadata block (Room ID, sport, visibility, and
 *     membership status/request). Meant to live inside the "Info" tab.
 * The Edit modal is owned here so both variants can trigger it, but it is only
 * rendered with the name variant (where the Edit button lives).
 */
const RoomHeader = ({
  room,
  isMember,
  isMembershipFetching,
  currentUserId,
  members,
  isCurrentUserAdmin,
  variant = "name",
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { editRoomAsync, editRoomLoading } = useEditRoom();

  let membershipTag = null;

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

    const membershipStatus = userMember ? userMember.status : "none";

    membershipTag = (
      <MembershipStatusTag
        status={membershipStatus}
        onRequestAccess={onRequestMembership}
        loading={createMembershipRequestLoading}
      />
    );
  }

  // Details variant: the metadata block for the Info tab, plus the admin-only
  // Edit control and its modal (Edit lives here rather than beside the room
  // name at the top of the page).
  if (variant === "details") {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Text type="secondary" style={{ marginRight: 8 }}>
          Room ID: {room.room_id}
        </Text>
        <SportTag sport={room.sport || "NFL"} />
        <Tag
          icon={room.public ? <UnlockOutlined /> : <LockOutlined />}
          color={room.public ? "green" : "red"}
          style={{ fontSize: "14px", padding: "4px 8px" }}
        >
          {room.public ? "Public" : "Private"}
        </Tag>
        {membershipTag}
        {isCurrentUserAdmin && (
          <Button
            size="small"
            onClick={() => {
              form.setFieldsValue({
                room_name: room.room_name,
                public: room.public,
                sport: room.sport || "NFL",
              });
              setEditModalVisible(true);
            }}
          >
            Edit
          </Button>
        )}

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
              sport: room.sport || "NFL",
            }}
          >
            <Form.Item name="sport" label="Sport">
              <Select disabled>
                <Select.Option value="NFL">NFL</Select.Option>
                <Select.Option value="MLB">MLB</Select.Option>
              </Select>
            </Form.Item>
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
  }

  // Name variant (default): just the room name at the top of the page.
  return (
    <div style={{ marginBottom: "16px" }}>
      <Title level={2} style={{ margin: 0 }}>
        {room.room_name}
      </Title>
    </div>
  );
};

export default RoomHeader;
