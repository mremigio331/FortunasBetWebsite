import React, { useState } from "react";
import {
  Card,
  Tag,
  Button,
  Space,
  Dropdown,
  Typography,
  message,
  Popconfirm,
  Avatar,
  Divider,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  CrownOutlined,
  CheckOutlined,
  CloseOutlined,
  SettingOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";
import useGetRoomMembers from "../../hooks/membership/useGetRoomMembers";
import useEditMembershipRequest from "../../hooks/membership/useEditMembershipRequest";

const { Title, Text } = Typography;

const MembershipManagement = ({ roomId, idToken }) => {
  const [expandedSection, setExpandedSection] = useState("members");

  // Get current user ID from token
  const currentUserId = idToken ? jwtDecode(idToken).sub : null;

  console.log("MembershipManagement Debug:", {
    roomId,
    currentUserId,
    hasIdToken: !!idToken,
  });

  const {
    members,
    memberCount,
    isMembersFetching,
    isMembersError,
    membersRefetch,
  } = useGetRoomMembers(roomId);

  console.log("Members Data:", {
    members,
    memberCount,
    isMembersFetching,
    isMembersError,
  });

  const { editMembershipRequestAsync, editMembershipRequestLoading } =
    useEditMembershipRequest();

  // Separate members by status (case-insensitive)
  const approvedMembers = members.filter(
    (member) => member.status?.toLowerCase() === "approved",
  );
  const pendingRequests = members.filter(
    (member) => member.status?.toLowerCase() === "pending",
  );
  const deniedMembers = members.filter(
    (member) => member.status?.toLowerCase() === "denied",
  );

  const handleStatusChange = async (
    targetUserId,
    newStatus,
    newMembershipType = null,
  ) => {
    console.log("handleStatusChange called with:", {
      targetUserId,
      newStatus,
      newMembershipType,
      roomId,
    });

    try {
      // Convert status to approve/deny boolean for the edit_membership_request endpoint
      const approve = newStatus.toLowerCase() === "approved";

      const requestData = {
        room_id: roomId,
        target_user_id: targetUserId,
        approve: approve,
      };

      console.log("Calling editMembershipRequestAsync with:", requestData);
      const result = await editMembershipRequestAsync(requestData);
      console.log("editMembershipRequestAsync result:", result);

      // Refresh the members list
      membersRefetch();
    } catch (error) {
      console.error("Failed to edit membership request:", error);
    }
  };

  const getStatusTag = (status) => {
    const normalizedStatus = status?.toUpperCase();
    const statusConfig = {
      APPROVED: { color: "green", text: "Active" },
      PENDING: { color: "orange", text: "Pending" },
      DENIED: { color: "red", text: "Denied" },
    };
    const config = statusConfig[normalizedStatus] || {
      color: "default",
      text: status,
    };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getMembershipTypeTag = (type) => {
    const normalizedType = type?.toUpperCase();
    const typeConfig = {
      ADMIN: { color: "purple", icon: <CrownOutlined />, text: "Admin" },
      MEMBER: { color: "blue", icon: <UserOutlined />, text: "Member" },
      REQUEST: { color: "orange", icon: <UserOutlined />, text: "Request" },
      INVITATION: { color: "cyan", icon: <UserOutlined />, text: "Invitation" },
    };
    const config = typeConfig[normalizedType] || {
      color: "default",
      text: type,
    };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getActionMenuItems = (member) => {
    const items = [];
    const isCurrentUser = member.user_id === currentUserId;
    const memberStatus = member.status?.toLowerCase();
    const memberType = member.membership_type?.toLowerCase();

    // Don't show actions for current user
    if (isCurrentUser) {
      return [];
    }

    // Status change actions
    if (memberStatus === "pending") {
      items.push(
        {
          key: "approve",
          label: "Approve Request",
          icon: <CheckOutlined />,
          onClick: () => {
            console.log("Approve Request clicked for user:", member.user_id);
            handleStatusChange(member.user_id, "APPROVED");
          },
        },
        {
          key: "deny",
          label: "Deny Request",
          icon: <CloseOutlined />,
          danger: true,
          onClick: () => {
            console.log("Deny Request clicked for user:", member.user_id);
            handleStatusChange(member.user_id, "DENIED");
          },
        },
      );
    } else if (memberStatus === "approved") {
      // Role change actions for approved members
      if (memberType === "member" || memberType === "request") {
        items.push({
          key: "promote-admin",
          label: "Promote to Admin",
          icon: <CrownOutlined />,
          onClick: () =>
            handleStatusChange(member.user_id, "APPROVED", "ADMIN"),
        });
      } else if (memberType === "admin") {
        items.push({
          key: "demote-member",
          label: "Demote to Member",
          icon: <UserOutlined />,
          onClick: () =>
            handleStatusChange(member.user_id, "APPROVED", "MEMBER"),
        });
      }

      items.push({
        key: "remove",
        label: "Remove from Room",
        icon: <CloseOutlined />,
        danger: true,
        onClick: () => handleStatusChange(member.user_id, "DENIED"),
      });
    } else if (memberStatus === "denied") {
      items.push(
        {
          key: "readmit-member",
          label: "Readmit as Member",
          icon: <CheckOutlined />,
          onClick: () =>
            handleStatusChange(member.user_id, "APPROVED", "MEMBER"),
        },
        {
          key: "readmit-admin",
          label: "Readmit as Admin",
          icon: <CrownOutlined />,
          onClick: () =>
            handleStatusChange(member.user_id, "APPROVED", "ADMIN"),
        },
      );
    }

    return items;
  };

  const renderMemberCard = (member) => {
    const menuItems = getActionMenuItems(member);

    return (
      <Card
        key={member.user_id}
        size="small"
        style={{ marginBottom: 8 }}
        bodyStyle={{ padding: "12px 16px" }}
      >
        <Row justify="space-between" align="middle">
          <Col span={16}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {/* User Info */}
              <Space>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: member.user_color || "#1890ff" }}
                  size="small"
                />
                <div>
                  <Text strong style={{ fontSize: "14px" }}>
                    {member.user_name || member.user_id}
                  </Text>
                  {member.is_current_user && (
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {" "}
                      (You)
                    </Text>
                  )}
                </div>
              </Space>

              {/* Status and Role Tags */}
              <Space size="small" wrap>
                {getStatusTag(member.status)}
                {getMembershipTypeTag(member.membership_type)}
              </Space>

              {/* Join Date */}
              {member.join_date && (
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Joined:{" "}
                  {new Date(member.join_date * 1000).toLocaleDateString()}
                </Text>
              )}
            </Space>
          </Col>

          <Col span={8} style={{ textAlign: "right" }}>
            {menuItems.length > 0 ? (
              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
                disabled={editMembershipRequestLoading}
                placement="bottomRight"
              >
                <Button
                  icon={<SettingOutlined />}
                  size="small"
                  loading={editMembershipRequestLoading}
                  style={{ width: "100%" }}
                >
                  Actions
                </Button>
              </Dropdown>
            ) : (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                -
              </Text>
            )}
          </Col>
        </Row>
      </Card>
    );
  };

  const renderMemberSection = (members, title, titleType = null, count) => {
    if (members.length === 0) return null;

    return (
      <div>
        <Title level={5} type={titleType} style={{ marginBottom: "12px" }}>
          {title} ({count})
        </Title>
        <div style={{ marginBottom: "16px" }}>
          {members.map(renderMemberCard)}
        </div>
      </div>
    );
  };

  const columns = [
    {
      title: "User",
      dataIndex: "user_name",
      key: "user_name",
      render: (userName, member) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: member.user_color || "#1890ff" }}
          />
          <div>
            <Text strong>{userName || member.user_id}</Text>
            {member.is_current_user && <Text type="secondary"> (You)</Text>}
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Role",
      dataIndex: "membership_type",
      key: "membership_type",
      render: (type) => getMembershipTypeTag(type),
    },
    {
      title: "Join Date",
      dataIndex: "join_date",
      key: "join_date",
      render: (joinDate) => {
        if (!joinDate) return "-";
        return new Date(joinDate * 1000).toLocaleDateString();
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, member) => {
        const menuItems = getActionMenuItems(member);

        if (menuItems.length === 0) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            disabled={isChangingStatus}
          >
            <Button
              icon={<SettingOutlined />}
              size="small"
              loading={isChangingStatus}
            >
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  if (isMembersError) {
    return (
      <Card title="Membership Management">
        <Text type="danger">Failed to load membership data</Text>
        <Button onClick={membersRefetch} style={{ marginLeft: 8 }}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          Membership Management
          <Tag color="blue">{memberCount} total</Tag>
        </Space>
      }
      extra={
        <Button
          onClick={membersRefetch}
          loading={isMembersFetching}
          size="small"
        >
          Refresh
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Active Members */}
        {renderMemberSection(
          approvedMembers,
          "Active Members",
          null,
          approvedMembers.length,
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <>
            <Divider />
            {renderMemberSection(
              pendingRequests,
              "Pending Requests",
              "warning",
              pendingRequests.length,
            )}
          </>
        )}

        {/* Denied Members */}
        {deniedMembers.length > 0 && (
          <>
            <Divider />
            {renderMemberSection(
              deniedMembers,
              "Denied/Removed Members",
              "secondary",
              deniedMembers.length,
            )}
          </>
        )}
      </Space>
    </Card>
  );
};

export default MembershipManagement;
