import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Dropdown,
  Typography,
  message,
  Popconfirm,
  Avatar,
  Divider,
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
import useChangeMemberStatus from "../../hooks/membership/useChangeMemberStatus";

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

  const { changeMemberStatus, isLoading: isChangingStatus } =
    useChangeMemberStatus();

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
    try {
      await changeMemberStatus({
        roomId,
        targetUserId,
        newStatus: newStatus.toLowerCase(),
        newMembershipType: newMembershipType?.toLowerCase(),
      });
    } catch (error) {
      console.error("Failed to change member status:", error);
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
          key: "approve-member",
          label: "Approve as Member",
          icon: <CheckOutlined />,
          onClick: () =>
            handleStatusChange(member.user_id, "APPROVED", "MEMBER"),
        },
        {
          key: "approve-admin",
          label: "Approve as Admin",
          icon: <CrownOutlined />,
          onClick: () =>
            handleStatusChange(member.user_id, "APPROVED", "ADMIN"),
        },
        {
          key: "deny",
          label: "Deny Request",
          icon: <CloseOutlined />,
          danger: true,
          onClick: () => handleStatusChange(member.user_id, "DENIED"),
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
        <div>
          <Title level={5}>Active Members ({approvedMembers.length})</Title>
          <Table
            dataSource={approvedMembers}
            columns={columns}
            rowKey="user_id"
            pagination={false}
            size="small"
            loading={isMembersFetching}
          />
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <>
            <Divider />
            <div>
              <Title level={5} type="warning">
                Pending Requests ({pendingRequests.length})
              </Title>
              <Table
                dataSource={pendingRequests}
                columns={columns}
                rowKey="user_id"
                pagination={false}
                size="small"
                loading={isMembersFetching}
              />
            </div>
          </>
        )}

        {/* Denied Members */}
        {deniedMembers.length > 0 && (
          <>
            <Divider />
            <div>
              <Title level={5} type="secondary">
                Denied/Removed Members ({deniedMembers.length})
              </Title>
              <Table
                dataSource={deniedMembers}
                columns={columns}
                rowKey="user_id"
                pagination={false}
                size="small"
                loading={isMembersFetching}
              />
            </div>
          </>
        )}
      </Space>
    </Card>
  );
};

export default MembershipManagement;
